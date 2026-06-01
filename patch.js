const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

code = code.replace(
    `let physicsBounds = { width: 1000, height: 1000, groundY: 1000, ceilingY: 0 };`,
    `let physicsBounds = { width: 1000, height: 1000, groundY: 1000, ceilingY: 0, wallLeftX: 0, wallRightX: 1000 };`
);

const boundsCalc1 = `            // 計算 Y 座標相對於 .hero-content 的位置
            physicsBounds.width = containerRect.width;
            physicsBounds.height = containerRect.height;
            physicsBounds.groundY = titleRect.top - containerRect.top - 30; // 減去 30x 創造留白
            physicsBounds.ceilingY = headerRect.bottom - containerRect.top;`;

const boundsCalc1New = `            // 計算 Y 座標相對於 .hero-content 的位置
            physicsBounds.width = containerRect.width;
            physicsBounds.height = containerRect.height;
            physicsBounds.groundY = titleRect.top - containerRect.top - 30; // 減去 30x 創造留白
            physicsBounds.ceilingY = headerRect.bottom - containerRect.top;

            const imgRatio = 3584 / 698;
            let expectedWidth = titleRect.height * imgRatio;
            let wallLeftX = 0;
            let wallRightX = physicsBounds.width;
            if (expectedWidth < titleRect.width) {
                wallLeftX = (titleRect.width - expectedWidth) / 2;
                wallRightX = titleRect.width - (titleRect.width - expectedWidth) / 2;
            }
            // 微調牆壁位置，讓它更貼合字母 C 和 連 的視覺邊緣
            wallLeftX += 10;
            wallRightX -= 10;
            
            physicsBounds.wallLeftX = wallLeftX;
            physicsBounds.wallRightX = wallRightX;`;
code = code.replace(boundsCalc1, boundsCalc1New);

const bodies1 = `            // 建立隱形物理邊界 (加厚至 2000px 防止快速拋擲穿透)
            const thickness = 2000;
            const ground = Bodies.rectangle(physicsBounds.width / 2, physicsBounds.groundY + thickness / 2, physicsBounds.width * 2, thickness, {
                isStatic: true
            });
            const ceiling = Bodies.rectangle(physicsBounds.width / 2, physicsBounds.ceilingY - thickness / 2, physicsBounds.width * 2, thickness, {
                isStatic: true
            });
            const leftWall = Bodies.rectangle(-thickness / 2, physicsBounds.height / 2, thickness, physicsBounds.height * 2, { isStatic: true });
            const rightWall = Bodies.rectangle(physicsBounds.width + thickness / 2, physicsBounds.height / 2, thickness, physicsBounds.height * 2, { isStatic: true });

            Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);`;

const bodies1New = `            // 建立隱形物理邊界 (加厚至 2000px 防止快速拋擲穿透)
            const thickness = 2000;
            const ground = Bodies.rectangle(physicsBounds.width / 2, physicsBounds.groundY + thickness / 2, physicsBounds.width * 2, thickness, {
                isStatic: true
            });
            const ceiling = Bodies.rectangle(physicsBounds.width / 2, physicsBounds.ceilingY - thickness / 2, physicsBounds.width * 2, thickness, {
                isStatic: true
            });
            const leftWall = Bodies.rectangle(physicsBounds.wallLeftX - thickness / 2, physicsBounds.height / 2, thickness, physicsBounds.height * 2, { isStatic: true });
            const rightWall = Bodies.rectangle(physicsBounds.wallRightX + thickness / 2, physicsBounds.height / 2, thickness, physicsBounds.height * 2, { isStatic: true });

            // 加入角落防卡方塊，防止標籤在牆角擠壓時穿透地板掉下去
            const leftCorner = Bodies.rectangle(physicsBounds.wallLeftX - 10, physicsBounds.groundY + 10, 100, 100, { isStatic: true, angle: Math.PI / 4 });
            const rightCorner = Bodies.rectangle(physicsBounds.wallRightX + 10, physicsBounds.groundY + 10, 100, 100, { isStatic: true, angle: Math.PI / 4 });

            Composite.add(engine.world, [ground, ceiling, leftWall, rightWall, leftCorner, rightCorner]);`;
code = code.replace(bodies1, bodies1New);

const resizeCalc = `                    physicsBounds.width = newContainerRect.width;
                    physicsBounds.height = newContainerRect.height;
                    physicsBounds.groundY = newTitleRect.top - newContainerRect.top - 15; // 減去 15px 創造留白
                    physicsBounds.ceilingY = newHeaderRect.bottom - newContainerRect.top;

                    Body.setPosition(ground, { x: physicsBounds.width / 2, y: physicsBounds.groundY + thickness / 2 });
                    Body.setPosition(ceiling, { x: physicsBounds.width / 2, y: physicsBounds.ceilingY - thickness / 2 });
                    Body.setPosition(leftWall, { x: -thickness / 2, y: physicsBounds.height / 2 });
                    Body.setPosition(rightWall, { x: physicsBounds.width + thickness / 2, y: physicsBounds.height / 2 });`;

const resizeCalcNew = `                    physicsBounds.width = newContainerRect.width;
                    physicsBounds.height = newContainerRect.height;
                    physicsBounds.groundY = newTitleRect.top - newContainerRect.top - 15; // 減去 15px 創造留白
                    physicsBounds.ceilingY = newHeaderRect.bottom - newContainerRect.top;

                    let newExpectedWidth = newTitleRect.height * imgRatio;
                    let newWallLeftX = 0;
                    let newWallRightX = physicsBounds.width;
                    if (newExpectedWidth < newTitleRect.width) {
                        newWallLeftX = (newTitleRect.width - newExpectedWidth) / 2;
                        newWallRightX = newTitleRect.width - (newTitleRect.width - newExpectedWidth) / 2;
                    }
                    newWallLeftX += 10;
                    newWallRightX -= 10;
                    
                    physicsBounds.wallLeftX = newWallLeftX;
                    physicsBounds.wallRightX = newWallRightX;

                    Body.setPosition(ground, { x: physicsBounds.width / 2, y: physicsBounds.groundY + thickness / 2 });
                    Body.setPosition(ceiling, { x: physicsBounds.width / 2, y: physicsBounds.ceilingY - thickness / 2 });
                    Body.setPosition(leftWall, { x: physicsBounds.wallLeftX - thickness / 2, y: physicsBounds.height / 2 });
                    Body.setPosition(rightWall, { x: physicsBounds.wallRightX + thickness / 2, y: physicsBounds.height / 2 });
                    Body.setPosition(leftCorner, { x: physicsBounds.wallLeftX - 10, y: physicsBounds.groundY + 10 });
                    Body.setPosition(rightCorner, { x: physicsBounds.wallRightX + 10, y: physicsBounds.groundY + 10 });`;
code = code.replace(resizeCalc, resizeCalcNew);

const dragLimits = `                    // 限制拖曳範圍，不讓滑鼠把標籤強制拉出邊界外
                    const padX = pill.offsetWidth / 2;
                    const padY = pill.offsetHeight / 2;
                    targetX = Math.max(padX, Math.min(physicsBounds.width - padX, targetX));
                    targetY = Math.max(physicsBounds.ceilingY + padY, Math.min(physicsBounds.groundY - padY, targetY));`;

const dragLimitsNew = `                    // 限制拖曳範圍，不讓滑鼠把標籤強制拉出邊界外
                    const padX = pill.offsetWidth / 2;
                    const padY = pill.offsetHeight / 2;
                    targetX = Math.max(physicsBounds.wallLeftX + padX, Math.min(physicsBounds.wallRightX - padX, targetX));
                    targetY = Math.max(physicsBounds.ceilingY + padY, Math.min(physicsBounds.groundY - padY, targetY));`;
code = code.replace(dragLimits, dragLimitsNew);

const updateBounds = `                    if (
                        body.position.y > physicsBounds.groundY + 100 ||
                        body.position.y < physicsBounds.ceilingY - 100 ||
                        body.position.x < -100 ||
                        body.position.x > physicsBounds.width + 100
                    ) {`;

const updateBoundsNew = `                    if (
                        body.position.y > physicsBounds.groundY + 100 ||
                        body.position.y < physicsBounds.ceilingY - 100 ||
                        body.position.x < physicsBounds.wallLeftX - 100 ||
                        body.position.x > physicsBounds.wallRightX + 100
                    ) {`;
code = code.replace(updateBounds, updateBoundsNew);

fs.writeFileSync('script.js', code);
console.log('done');
