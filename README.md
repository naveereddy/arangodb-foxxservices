# admin
get all business and jobs and categories

# foxx api creation
1. first we need to install arangodb and after install if we run we will get 0.0.0.0:8529 web page
2. we have login page and we can login with  username 'root' and password ''
3. we will get one _system database here we can create anther database in db tab
4. after creating db we need to enter into it and there we can crate collections and services
4. creating foxx service in web interface and download it we get on folder with service name..
5. open serveice folder we will see sub folders like routes and models and scripts and main.js and manifest.json file
6. main.js file having routes for the collections
7. manifest file having the details about the project . like arangodb version and service name and author and license , scripts
8. scripts having two file like setup.js and teardown.js
9. setup.js creating the collections what ever documentCollections array having.
10. teardown.js deletes the collection what ever collections array conatin while deleteing the  foxx service
11. we can create models by using 'Joi' framework. here we have option for validating the arttributes of model.


# License

Copyright (c) 2018 saisyam

License: MIT