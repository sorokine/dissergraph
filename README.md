# dissergraph

dissergraph visuals

## Dependencies

 * node.js 0.10.24 from http://nodejs.org/
 * graphviz 2.26.3 from from http://grapphviz.org/ 

```
npm install csv
npm install graphviz

```

Tested to work on Ubuntu 12.04 and OS X but should work on any system that supports node.js and graphviz.   

## Usage

Place db.txt file in the project directory and run ```node csv2gv.js```.  This will create dissergraph.gv file that can be viewed using *xdot* on Linux of graphviz viewer on OS X.  To create an SVG file with the diagram run the following command:
```
node csv2gv.js && neato -Tsvg dissergraph.gv > dissergraph.svg
```
SVG can be viewed in a modern browser like Google Chrome and it has tooltips with the names and titles for each node and edge.

## Developing



### Tools

Created with [Nodeclipse](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   

