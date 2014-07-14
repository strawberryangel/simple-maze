simple-maze
===========

Make a N x M rectangular maze by walking through it, dropping bread crumbs, and knocking down walls.

There is a display method that just does a simple ASCII display.

Example:

```javascript
var maze = new Maze();
maze.createMaze(36, 11);
maze.display();
```

By Sophie L'Ange. I just did this as an exercise after reading about mazes and spanning trees. 
No fancy algorithms, weighting, stacks or anything.
