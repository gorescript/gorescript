gorescript classic
==================

A '90s-style 2.5D first-person shooter game built from scratch, complete with its own content creation pipeline.

See [releases](https://github.com/gorescript/gorescript/releases) for corresponding asset bundles.

How to build
------------
The steps to build it are:

- Download the repository
- Download the assets zip from [here](https://github.com/gorescript/gorescript/releases/download/v1.1/assets.zip)
- Unpack the assets to the \src\game folder (so the \src\game folder should now contain an \assets folder)
- Install Node.js
- Open a command line window, go to the root folder of the repository
- Run the commands:

        npm install gulp -g
        npm install
        gulp web-debug

- When it says "finished js-client" hit CTRL+C and terminate it
- Go to the newly created \dist folder (in the root of the repository)
- Run the commands:

        npm install http-server -g
        http-server

http://localhost:8080 should now contain a playable version of the game.

Custom maps
-----------
- [Halls of Illusion](https://raw.githubusercontent.com/gorescript/gorescript/master/custom-maps/halls_of_illusion_by_harlaap.json) by [@harlaap](https://twitter.com/harlaap)
