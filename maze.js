'use strict';

// Make a N x M rectangular maze by walking through it,
// dropping bread crumbs, and knocking down walls.
//
// Use:
//      var maze = new Maze();
//      maze.createMaze(36, 11);
//      maze.display();
//
// By Sophie L'Ange. I just did this as an exercise after
// reading about mazes and spanning trees. No fancy algorithms,
// weighting, stacks or anything.
//
function Maze() {
    var self = this;

    // Set true before calling createMaze() to see the walk through.
    self.debug = false;

    var x, y; // Current position
    var breadcrumb; // Current bread crumb
    var count, total; // How many cells visited and how many total cells.

    function atBottom() {
        return y == 0;
    }

    function atLeft() {
        return x == 0;
    }

    function atRight() {
        return x == self.xSize - 1;
    }

    function atTop() {
        return y == self.ySize - 1;
    }

    // Follow the maze backwards until we find a cell with unvisited neighbors.
    //
    // Returns: boolean
    //      true - We found a cell with unvisited neighbors.
    //      false - We couldn't find any. Try another method.
    function backTrack() {

        function breadCrumbAbove() {
            return self.maze[x][y + 1].breadcrumb;

        }

        function breadCrumbBelow() {
            return self.maze[x][y - 1].breadcrumb;
        }

        function breadCrumbToTheLeft() {
            return self.maze[x - 1][y].breadcrumb;
        }

        function breadCrumbToTheRight() {
            return self.maze[x + 1][y].breadcrumb;
        }

        function isOpenAbove() {
            return !atTop() && !self.maze[x][y + 1].bottomWall;
        }

        function isOpenBelow() {
            // Still need to test atBottom() because the exit is down here
            // and we don't count the exit.
            return !atBottom() && !self.maze[x][y].bottomWall;
        }

        function isOpenLeft() {
            return !atLeft() && !self.maze[x - 1][y].rightWall;
        }

        function isOpenRight() {
            return !self.maze[x][y].rightWall;
        }

        function rememberBreadCrumb() {
            breadcrumb = self.maze[x][y].breadcrumb;
        }

        for (; ;) {
            // If we're back at the beginning of the maze, then we're done.
            if (breadcrumb == 1) return false;

            // Look at the bread crumbs next to us that we can see (not through walls).
            // If one has a smaller number, it's closer to the exit than we are.
            // Move there and remember the new bread crumb.
            if (self.debug) console.log("(", x, ", ", y, "): backtrack ", self.maze[x][y]);
            if (isOpenAbove() && breadCrumbAbove() < breadcrumb) {
                moveUp();
                rememberBreadCrumb();
            } else if (isOpenLeft() && breadCrumbToTheLeft() < breadcrumb) {
                moveLeft();
                rememberBreadCrumb();
            } else if (isOpenRight() && breadCrumbToTheRight() < breadcrumb) {
                moveRight();
                rememberBreadCrumb();
            } else if (isOpenBelow() && breadCrumbBelow() < breadcrumb) {
                moveDown();
                rememberBreadCrumb();
            } else {
                // We shouldn't get here.
                // If by some dumb chance we did get here then
                // just say that we got lost (false).
                return false;
            }

            // See if we have an unvisited neighbor.
            if (hasUnvisitedNeighbor()) return true;
        }
    }

    self.createMaze = function (xSize, ySize) {
        makeNewMaze(xSize, ySize);

        breadcrumb = 0;
        count = 0;

        // Pick a random starting position.
        self.entrance = getRandomInt(0, xSize);

        x = self.entrance;
        y = ySize - 1;
        dropBreadCrumb();

        if (self.debug) console.log("Creating a new maze. width = ", xSize, " height = ", ySize);
        if (self.debug) console.log("(", x, ", ", y, "): starting cell ", self.maze[x][y]);

        while (count < total) {
            // See who we can visit.
            var neighbors = findOutWhatWeCanDoHere();
            if (neighbors.length == 0) {
                if (self.debug) console.log("(", x, ", ", y, "): No unvisited neighbors.");
                findCellWithUnvisitedNeighbors();
                continue;
            }

            // Visit a random neighbor.
            var action = neighbors[getRandomInt(0, neighbors.length)];
            var report = function (neighbors, action) {
                if (self.debug) console.log("(", x, ", ", y, "):  unvisited neighbors at ", neighbors, ' choosing to ', action);
            };
            if (action === "move up") {
                report(neighbors, action);
                removeTopWall();
                moveUp();
                dropBreadCrumb();
            } else if (action === "move down") {
                report(neighbors, action);
                removeBottomWall();
                moveDown();
                dropBreadCrumb();
            } else if (action === "move left") {
                report(neighbors, action);
                removeLeftWall();
                moveLeft();
                dropBreadCrumb();
            } else if (action === "move right") {
                report(neighbors, action);
                removeRightWall();
                moveRight();
                dropBreadCrumb();
            } else if (action === "make exit") {
                if (self.debug) console.log("(", x, ", ", y, "): Making exit");
                makeExit();
                findCellWithUnvisitedNeighbors();
            } else
                throw new Error("Bug. I don't know this action ~ ", action);
        }

        // Because of random choice it's possible to
        // touch the bottom and go zooming off without ever
        // choosing to make an exit.
        //
        // If we did that, then choose a random
        // bottom wall to knock out for the exit.
        if (self.exit === null) {
            teleportTo(getRandomInt(0, self.xSize), 0);
            makeExit();
        }

        if (self.debug) console.log("Exit at (", self.exit, ", ", 0, ")");
    };

    self.display = function () {
        // Top line with entrance
        var line = ['+'];
        for (x = 0; x < self.xSize; x++)
            line.push(x == self.entrance ? ' +' : '-+');
        console.log(line.join(''));

        for (y = self.ySize - 1; y >= 0; y--) {
            // Vertical parts.
            line = ['|'];
            for (x = 0; x < self.xSize; x++)
                line.push(self.maze[x][y].rightWall ? ' |' : '  ');
            console.log(line.join(''));

            // Horizontal parts.
            line = ['+'];
            for (x = 0; x < self.xSize; x++)
                line.push(self.maze[x][y].bottomWall ? '-+' : ' +');
            console.log(line.join(''));
        }
    };

    function dropBreadCrumb() {
        breadcrumb += 1;
        self.maze[x][y].breadcrumb = breadcrumb;
        count += 1;
    }

    function findCellWithUnvisitedNeighbors() {

        if (backTrack()) return;
        if (self.debug) console.log("(", x, ", ", y, "): backtrack failed. Scanning.", self.maze[x][y]);

        // Scan all cells to find one we've visited with unvisited neighbors.
        // Start in the upper right corner and move right.
        for (var yi = self.ySize - 1; yi >= 0; yi--) {
            for (var xi = 0; xi < self.xSize; xi++)
                if (self.maze[xi][yi].breadcrumb) {
                    teleportTo(xi, yi);
                    if (hasUnvisitedNeighbor()) return;
                }
        }

        // If the whole maze is full,
        // we shouldn't have tried to come here.
        // But we are here and we can clean up
        // be done  with everything.
        count = total;
    }

    function findOutWhatWeCanDoHere() {
        var result = [];

        if (!atTop() && !visitedAbove()) result.push("move up");
        if (!atLeft() && !visitedLeft()) result.push("move left");
        if (!atRight() && !visitedRight()) result.push("move right");
        if (!atBottom() && !visitedBelow()) result.push("move down");

        if (atBottom() && self.exit === null) result.push("make exit");

        return result;
    }

    // Copied from http://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    // Returns a random integer between min (included) and max (excluded)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function hasUnvisitedNeighbor() {
        return (!atTop() && !visitedAbove()) ||
            (!atLeft() && !visitedLeft()) ||
            (!atRight() && !visitedRight()) ||
            (!atBottom() && !visitedBelow());
    }

    function makeExit() {
        self.exit = x;
        removeBottomWall();
    }

    function makeNewMaze(xSize, ySize) {
        self.xSize = xSize;
        self.ySize = ySize;
        total = xSize * ySize;

        self.entrance = null;
        self.exit = null;

        self.maze = new Array(xSize);
        for (var i = 0; i < xSize; i++) {
            self.maze[i] = new Array(ySize);

            for (var j = 0; j < ySize; j++)
                self.maze[i][j] = {
                    breadcrumb: null,
                    bottomWall: true,
                    rightWall: true
                }
        }
    }

    function moveDown() {
        y -= 1;
    }

    function moveLeft() {
        x -= 1;
    }

    function moveRight() {
        x += 1;
    }

    function moveUp() {
        y += 1;
    }

    function removeBottomWall() {
        self.maze[x][y].bottomWall = false;
    }

    function removeLeftWall() {
        self.maze[x - 1][y].rightWall = false;
    }

    function removeRightWall() {
        self.maze[x][y].rightWall = false;
    }

    function removeTopWall() {
        self.maze[x][y + 1].bottomWall = false;
    }

    function teleportTo(newX, newY) {
        x = newX;
        y = newY;
        breadcrumb = self.maze[x][y].breadcrumb;
    }

    function visitedAbove() {
        return self.maze[x][y + 1].breadcrumb !== null;
    }

    function visitedBelow() {
        return self.maze[x][y - 1].breadcrumb !== null;
    }

    function visitedLeft() {
        return self.maze[x - 1][y].breadcrumb !== null;
    }

    function visitedRight() {
        return self.maze[x + 1][y].breadcrumb !== null;
    }
}

var maze = new Maze();
maze.debug = true;
maze.createMaze(6, 6);
maze.display();

