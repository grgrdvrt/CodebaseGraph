# CodebaseGraph
A tool to visualize a js codebase


# Requirements
You will need to install [graphviz](http://graphviz.org/) in order to visualize the graph or export it to the format of your choice

Don't forget to install the dependencies:
```
cd /path/to/CodebaseGraph/
npm install
```



# usage
Generate the dot file:
```
node js/index.js /path/to/my/js/codebase/ -o /path/to/result.dot
```

Export as pdf using dot:
```
dot -Tpdf /path/to/result.dot -o /path/to/result.pdf
```
