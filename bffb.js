"manifest": {
        "name": "brainfuck for binary",
        "packname": "com.brainfuck.binary",
        "description": "使用16列18行的内存表，带程序运行日志和快捷键功能",
        "lib": [],
        "incompatible": []
    }

    // 插件主逻辑
    (function() {
        // 内存初始化：16×2=32格缓冲区 + 16×16=256格显示屏 = 16×18=288格总内存
        const cols = 16;          // 16列
        const bufferRows = 2;     // 2行作为缓冲区
        const displayRows = 16;   // 16行作为显示屏
        const totalRows = 18;     // 总共18行
        const bufferSize = cols * bufferRows;       // 32格缓冲区
        const displaySize = cols * displayRows;     // 256格显示屏
        const totalMemorySize = cols * totalRows;   // 288格总内存 (16×18)
        let memory = new Array(totalMemorySize).fill(0);
        let instructionPointer = 0;  // 指令指针，从0开始
        let memoryPointer = 0;       // 内存指针，从缓冲区第一格开始（内部仍为0索引）
        let loopStack = [];
        let isRunning = false;
        let intervalId = null;
        let executionSpeed = 100; // 执行速度，毫秒
        let executionLog = [];     // 程序运行日志

        // 注册键盘快捷键
        const registerHotkeys = () => {
            document.addEventListener('keydown', (e) => {
                // 按M键切换内存菜单显示
                if (e.key.toLowerCase() === 'm') {
                    e.preventDefault(); // 防止默认行为（如页面滚动）
                    toggleMemoryViewer();
                }
                // 按ESC键关闭内存菜单
                else if (e.key === 'Escape') {
                    const memoryViewer = document.getElementById('memory-viewer');
                    if (memoryViewer && memoryViewer.style.display === 'flex') {
                        e.preventDefault();
                        toggleMemoryViewer();
                    }
                }
            });
        };

        // 创建内存按钮
        const createMemoryButton = () => {
            const memoryButton = document.createElement('button');
            memoryButton.id = 'memory-button';
            memoryButton.className = 'control-button';
            memoryButton.textContent = '内存';
            memoryButton.style.top = '90px'; // 位于Bin按钮下方
            memoryButton.onclick = toggleMemoryViewer;
            
            document.body.appendChild(memoryButton);
        };

        // 创建内存查看器 - 包含运行日志
        const createMemoryViewer = () => {
            const memoryViewer = document.createElement('div');
            memoryViewer.id = 'memory-viewer';
            memoryViewer.className = 'viewer';
            
            const viewerContent = document.createElement('div');
            viewerContent.className = 'viewer-content';
            viewerContent.style.maxWidth = '700px';
            viewerContent.style.width = '95%';
            
            // 标题
            const title = document.createElement('h3');
            title.textContent = '内存状态 (16列 × 18行，索引从1开始)';
            title.style.fontSize = '1.1em';
            viewerContent.appendChild(title);
            
            // 控制按钮
            const controlDiv = document.createElement('div');
            controlDiv.style.marginBottom = '10px';
            controlDiv.style.display = 'flex';
            controlDiv.style.gap = '8px';
            controlDiv.style.flexWrap = 'wrap';
            
            const runButton = document.createElement('button');
            runButton.id = 'run-program';
            runButton.className = 'form-button submit-button';
            runButton.textContent = '运行程序';
            runButton.style.padding = '4px 8px';
            runButton.style.fontSize = '0.9em';
            runButton.onclick = toggleExecution;
            
            const stepButton = document.createElement('button');
            stepButton.id = 'step-program';
            stepButton.className = 'form-button submit-button';
            stepButton.textContent = '单步执行';
            stepButton.style.padding = '4px 8px';
            stepButton.style.fontSize = '0.9em';
            stepButton.onclick = executeStep;
            
            const resetButton = document.createElement('button');
            resetButton.id = 'reset-program';
            resetButton.className = 'form-button cancel-button';
            resetButton.textContent = '重置';
            resetButton.style.padding = '4px 8px';
            resetButton.style.fontSize = '0.9em';
            resetButton.onclick = resetProgram;

            const clearLogButton = document.createElement('button');
            clearLogButton.id = 'clear-log';
            clearLogButton.className = 'form-button';
            clearLogButton.textContent = '清空日志';
            clearLogButton.style.padding = '4px 8px';
            clearLogButton.style.fontSize = '0.9em';
            clearLogButton.onclick = clearExecutionLog;
            
            controlDiv.appendChild(runButton);
            controlDiv.appendChild(stepButton);
            controlDiv.appendChild(resetButton);
            controlDiv.appendChild(clearLogButton);
            viewerContent.appendChild(controlDiv);
            
            // 执行状态
            const statusDiv = document.createElement('div');
            statusDiv.id = 'execution-status';
            statusDiv.style.marginBottom = '10px';
            statusDiv.style.padding = '6px';
            statusDiv.style.backgroundColor = '#f0f0f0';
            statusDiv.style.borderRadius = '4px';
            statusDiv.style.fontSize = '0.9em';
            statusDiv.textContent = '就绪 - 指令指针: 0, 内存位置: (1,1) [缓冲区]';
            viewerContent.appendChild(statusDiv);
            
            // 内存表容器（不滚动，完整显示）
            const tableContainer = document.createElement('div');
            tableContainer.style.overflow = 'visible';
            tableContainer.style.maxHeight = 'none';
            viewerContent.appendChild(tableContainer);
            
            // 16列18行内存表
            const memoryTable = document.createElement('table');
            memoryTable.id = 'memory-table';
            memoryTable.style.borderCollapse = 'collapse';
            memoryTable.style.margin = '0 auto';
            memoryTable.style.tableLayout = 'fixed';
            tableContainer.appendChild(memoryTable);
            
            // 创建表头（列索引，从1开始）
            const headerRow = document.createElement('tr');
            
            // 空白单元格（左上角）
            const cornerCell = document.createElement('th');
            cornerCell.style.border = '1px solid #666';
            cornerCell.style.padding = '2px';
            cornerCell.style.backgroundColor = '#f0f0f0';
            cornerCell.style.fontSize = '0.8em';
            cornerCell.style.width = '20px';
            headerRow.appendChild(cornerCell);
            
            // 列索引（1-16）
            for (let col = 0; col < cols; col++) {
                const headerCell = document.createElement('th');
                headerCell.textContent = col + 1;
                headerCell.style.border = '1px solid #666';
                headerCell.style.padding = '2px';
                headerCell.style.width = '22px';
                headerCell.style.textAlign = 'center';
                headerCell.style.backgroundColor = '#f0f0f0';
                headerCell.style.fontSize = '0.8em';
                headerRow.appendChild(headerCell);
            }
            memoryTable.appendChild(headerRow);
            
            // 创建表体（18行数据，行索引从1开始）
            for (let row = 0; row < totalRows; row++) {
                const dataRow = document.createElement('tr');
                
                // 行索引（1-18）
                const rowIndexCell = document.createElement('th');
                rowIndexCell.textContent = row + 1;
                rowIndexCell.style.border = '1px solid #666';
                rowIndexCell.style.padding = '2px';
                rowIndexCell.style.textAlign = 'center';
                rowIndexCell.style.backgroundColor = '#f0f0f0';
                rowIndexCell.style.fontSize = '0.8em';
                dataRow.appendChild(rowIndexCell);
                
                // 行数据（16列）
                for (let col = 0; col < cols; col++) {
                    const cell = document.createElement('td');
                    const index = row * cols + col;
                    cell.id = `memory-cell-${index}`;
                    cell.textContent = memory[index];
                    cell.style.border = '1px solid #ccc';
                    cell.style.width = '22px';
                    cell.style.height = '22px';
                    cell.style.textAlign = 'center';
                    cell.style.verticalAlign = 'middle';
                    cell.style.fontFamily = 'monospace';
                    cell.style.fontSize = '11px';
                    
                    // 缓冲区（前两行）使用不同背景色
                    if (row < bufferRows) {
                        cell.style.backgroundColor = '#e3f2fd';
                    }
                    
                    dataRow.appendChild(cell);
                }
                
                memoryTable.appendChild(dataRow);
            }
            
            // 程序运行日志区域
            const logContainer = document.createElement('div');
            logContainer.style.marginTop = '15px';
            viewerContent.appendChild(logContainer);
            
            // 日志标题
            const logTitle = document.createElement('h4');
            logTitle.textContent = '程序运行日志';
            logTitle.style.fontSize = '1em';
            logTitle.style.margin = '0 0 8px 0';
            logContainer.appendChild(logTitle);
            
            // 日志内容区域
            const logContent = document.createElement('div');
            logContent.id = 'execution-log';
            logContent.style.border = '1px solid #ccc';
            logContent.style.borderRadius = '4px';
            logContent.style.padding = '8px';
            logContent.style.maxHeight = '200px';
            logContent.style.overflowY = 'auto';
            logContent.style.fontFamily = 'monospace';
            logContent.style.fontSize = '0.85em';
            logContent.style.backgroundColor = '#f9f9f9';
            logContainer.appendChild(logContent);
            
            // 表格说明和快捷键提示
            const tableInfo = document.createElement('div');
            tableInfo.style.marginTop = '8px';
            tableInfo.style.fontSize = '12px';
            tableInfo.style.color = '#666';
            tableInfo.innerHTML = `
                <p>• 前 ${bufferRows} 行 (行 1-${bufferRows}) 为缓冲区</p>
                <p>• 后 ${displayRows} 行 (行 ${bufferRows+1}-${totalRows}) 为显示屏</p>
                <p>• 高亮单元格为当前内存指针位置</p>
                <p>• 快捷键: M键(切换内存菜单) | ESC键(关闭内存菜单)</p>
            `;
            viewerContent.appendChild(tableInfo);
            
            // 关闭按钮
            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.textContent = '关闭';
            closeButton.style.padding = '4px 8px';
            closeButton.style.fontSize = '0.9em';
            closeButton.onclick = toggleMemoryViewer;
            viewerContent.appendChild(closeButton);
            
            memoryViewer.appendChild(viewerContent);
            document.body.appendChild(memoryViewer);
            
            // 初始化内存显示
            updateMemoryDisplay();
            updateExecutionLog();
        };

        // 添加日志条目
        const addLogEntry = (message) => {
            const timestamp = new Date().toLocaleTimeString();
            executionLog.push(`[${timestamp}] ${message}`);
            updateExecutionLog();
        };

        // 更新日志显示
        const updateExecutionLog = () => {
            const logElement = document.getElementById('execution-log');
            if (logElement) {
                logElement.innerHTML = executionLog.join('<br>');
                // 自动滚动到底部
                logElement.scrollTop = logElement.scrollHeight;
            }
        };

        // 清空日志
        const clearExecutionLog = () => {
            executionLog = [];
            updateExecutionLog();
            addLogEntry('日志已清空');
        };

        // 更新内存显示
        const updateMemoryDisplay = () => {
            // 更新所有内存单元格
            for (let index = 0; index < totalMemorySize; index++) {
                const cell = document.getElementById(`memory-cell-${index}`);
                if (cell) {
                    cell.textContent = memory[index];
                    
                    // 重置样式
                    cell.style.backgroundColor = '';
                    cell.style.border = '1px solid #ccc';
                    cell.style.fontWeight = 'normal';
                    
                    // 恢复缓冲区背景色
                    const row = Math.floor(index / cols);
                    if (row < bufferRows) {
                        cell.style.backgroundColor = '#e3f2fd';
                    }
                    
                    // 高亮当前内存指针位置
                    if (index === memoryPointer) {
                        cell.style.backgroundColor = '#ffcdd2';
                        cell.style.border = '2px solid #e53935';
                        cell.style.fontWeight = 'bold';
                    }
                    
                    // 显示屏单元格根据值显示颜色
                    if (row >= bufferRows) {
                        if (memory[index] === 1) {
                            cell.style.backgroundColor = '#212121';
                            cell.style.color = 'white';
                        } else {
                            cell.style.color = 'black';
                        }
                    }
                }
            }
            
            // 更新状态显示
            const row = Math.floor(memoryPointer / cols);
            const col = memoryPointer % cols;
            const displayRow = row + 1;
            const displayCol = col + 1;
            const positionType = row < bufferRows ? '缓冲区' : '显示屏';
            document.getElementById('execution-status').textContent = 
                isRunning ? `运行中 - 指令指针: ${instructionPointer}, 内存位置: (${displayRow},${displayCol}) [${positionType}]` : 
                `已停止 - 指令指针: ${instructionPointer}, 内存位置: (${displayRow},${displayCol}) [${positionType}]`;
        };

        // 切换内存查看器显示
        function toggleMemoryViewer() {
            const memoryViewer = document.getElementById('memory-viewer');
            const currentDisplay = memoryViewer.style.display;
            
            // 切换显示状态
            if (currentDisplay === 'flex') {
                memoryViewer.style.display = 'none';
                addLogEntry('内存菜单已关闭（通过快捷键）');
            } else {
                memoryViewer.style.display = 'flex';
                addLogEntry('内存菜单已打开（通过快捷键）');
            }
            
            updateMemoryDisplay();
        }

        // 从纸带获取指令
        const getInstructionsFromTape = () => {
            const binaryString = getTapeBinary();
            const instructions = [];
            
            // 每3位一组解析为指令
            for (let i = 0; i + 2 < binaryString.length; i += 3) {
                instructions.push(binaryString.substr(i, 3));
            }
            
            return instructions;
        };

        // 获取指令的描述文本
        const getInstructionDescription = (instruction) => {
            const descriptions = {
                '100': '将所在位置的二进制值加1',
                '001': '将所在位置的二进制值减1',
                '110': '向左移动一格',
                '011': '向右移动一格',
                '111': '循环开始',
                '000': '循环结束',
                '101': '如果当前值为1则打破循环',
                '010': '如果当前值为0则打破循环'
            };
            return descriptions[instruction] || `未知指令: ${instruction}`;
        };

        // 执行单步指令
        const executeStep = () => {
            const instructions = getInstructionsFromTape();
            
            // 检查是否超出指令范围
            if (instructionPointer < 0 || instructionPointer >= instructions.length) {
                stopExecution();
                const message = '已完成 - 无更多指令';
                document.getElementById('execution-status').textContent = message;
                addLogEntry(message);
                return false;
            }
            
            const currentInstruction = instructions[instructionPointer];
            const instructionDesc = getInstructionDescription(currentInstruction);
            const prevPointer = memoryPointer;
            
            // 执行指令
            switch (currentInstruction) {
                case '100': // 将所在位置的二进制加1
                    const oldValue100 = memory[memoryPointer];
                    memory[memoryPointer] = oldValue100 ? 0 : 1;
                    addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，从 ${oldValue100} 变为 ${memory[memoryPointer]}`);
                    instructionPointer++;
                    break;
                    
                case '001': // 将所在位置的二进制减1
                    const oldValue001 = memory[memoryPointer];
                    memory[memoryPointer] = oldValue001 ? 0 : 1;
                    addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，从 ${oldValue001} 变为 ${memory[memoryPointer]}`);
                    instructionPointer++;
                    break;
                    
                case '110': // 向左移动一格
                    const currentRowLeft = Math.floor(memoryPointer / cols);
                    const currentColLeft = memoryPointer % cols;
                    let newColLeft = currentColLeft - 1;
                    let newRowLeft = currentRowLeft;
                    
                    if (newColLeft < 0) {
                        newColLeft = cols - 1;
                        newRowLeft = currentRowLeft - 1;
                        if (newRowLeft < 0) newRowLeft = totalRows - 1;
                    }
                    
                    memoryPointer = newRowLeft * cols + newColLeft;
                    addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，从 (${currentRowLeft+1},${currentColLeft+1}) 移动到 (${newRowLeft+1},${newColLeft+1})`);
                    instructionPointer++;
                    break;
                    
                case '011': // 向右移动一格
                    const currentRowRight = Math.floor(memoryPointer / cols);
                    const currentColRight = memoryPointer % cols;
                    let newColRight = currentColRight + 1;
                    let newRowRight = currentRowRight;
                    
                    if (newColRight >= cols) {
                        newColRight = 0;
                        newRowRight = currentRowRight + 1;
                        if (newRowRight >= totalRows) newRowRight = 0;
                    }
                    
                    memoryPointer = newRowRight * cols + newColRight;
                    addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，从 (${currentRowRight+1},${currentColRight+1}) 移动到 (${newRowRight+1},${newColRight+1})`);
                    instructionPointer++;
                    break;
                    
                case '111': // 循环开始
                    loopStack.push(instructionPointer);
                    addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，压入循环栈 (位置: ${instructionPointer})`);
                    instructionPointer++;
                    break;
                    
                case '000': // 循环结束
                    if (loopStack.length > 0) {
                        const loopStart = loopStack[loopStack.length - 1];
                        instructionPointer = loopStart;
                        addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，返回到循环开始 (位置: ${loopStart})`);
                    } else {
                        addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，无匹配的循环开始`);
                        instructionPointer++;
                    }
                    break;
                    
                case '101': // 读取所在方块的值，是1打破循环
                    const value101 = memory[memoryPointer];
                    if (value101 === 1 && loopStack.length > 0) {
                        const loopStart = loopStack.pop();
                        addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，当前值为1，退出循环 (原开始位置: ${loopStart})`);
                    } else {
                        addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，当前值为${value101}，继续循环`);
                    }
                    instructionPointer++;
                    break;
                    
                case '010': // 读取所在方块的值，是0打破循环
                    const value010 = memory[memoryPointer];
                    if (value010 === 0 && loopStack.length > 0) {
                        const loopStart = loopStack.pop();
                        addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，当前值为0，退出循环 (原开始位置: ${loopStart})`);
                    } else {
                        addLogEntry(`执行指令 ${currentInstruction}: ${instructionDesc}，当前值为${value010}，继续循环`);
                    }
                    instructionPointer++;
                    break;
                    
                default: // 未知指令
                    addLogEntry(`执行未知指令 ${currentInstruction}，跳过`);
                    instructionPointer++;
                    break;
            }
            
            updateMemoryDisplay();
            return true;
        };

        // 切换执行状态
        const toggleExecution = () => {
            if (isRunning) {
                stopExecution();
            } else {
                startExecution();
            }
        };

        // 开始执行程序
        const startExecution = () => {
            if (isRunning) return;
            
            isRunning = true;
            document.getElementById('run-program').textContent = '停止';
            const row = Math.floor(memoryPointer / cols);
            const col = memoryPointer % cols;
            const displayRow = row + 1;
            const displayCol = col + 1;
            const positionType = row < bufferRows ? '缓冲区' : '显示屏';
            const statusText = `运行中 - 指令指针: ${instructionPointer}, 内存位置: (${displayRow},${displayCol}) [${positionType}]`;
            document.getElementById('execution-status').textContent = statusText;
            addLogEntry('程序开始运行');
            
            intervalId = setInterval(() => {
                if (!executeStep()) {
                    stopExecution();
                }
            }, executionSpeed);
        };

        // 停止执行程序
        const stopExecution = () => {
            if (!isRunning) return;
            
            isRunning = false;
            clearInterval(intervalId);
            document.getElementById('run-program').textContent = '运行程序';
            const row = Math.floor(memoryPointer / cols);
            const col = memoryPointer % cols;
            const displayRow = row + 1;
            const displayCol = col + 1;
            const positionType = row < bufferRows ? '缓冲区' : '显示屏';
            const statusText = `已停止 - 指令指针: ${instructionPointer}, 内存位置: (${displayRow},${displayCol}) [${positionType}]`;
            document.getElementById('execution-status').textContent = statusText;
            addLogEntry('程序已停止');
        };

        // 重置程序状态
        const resetProgram = () => {
            stopExecution();
            const oldPointer = memoryPointer;
            instructionPointer = 0;
            memoryPointer = 0;
            loopStack = [];
            memory.fill(0);
            addLogEntry('程序已重置，内存清空，指针复位');
            updateMemoryDisplay();
        };

        // 初始化插件
        const initPlugin = () => {
            createMemoryButton();
            createMemoryViewer();
            registerHotkeys(); // 注册快捷键
            addLogEntry('解释器已初始化完成，就绪');
            addLogEntry('提示: 按M键切换内存菜单，按ESC键关闭内存菜单');
            
            console.log('带运行日志和快捷键的16列18行内存表二进制指令解释器已加载');
        };

        // 当页面加载完成后初始化插件
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPlugin);
        } else {
            initPlugin();
        }
    })();
    
