Intro
=====
This project is composed of a few different pieces:
* Mongodb database
* Static web visualization (made with three.js)
* Flask-based web API

Database
--------
We use mongodb to store article contents from the Guardian API. Create a database in your mongo server, then on the server, set these environment variables:

    GUARDIAN_MONGO_USERNAME
    GUARDIAN_MONGO_PASSWORD
    GUARDIAN_MONGO_DB (database name)
    GUARDIAN_MONGO_URL

Once that's ready, run the script `mine.py` to fill the database with the latest article data. To get the latest automatically, it might be useful to set up the script to run as a daily cron job.

Web Frontend
------------
The root of this reposity should be set up as the webroot of the frontend site. Install local npm dependencies by running:

    $ npm install

Then compile the CoffeeScript source to JavaScript:

    $ node_modules/.bin/browserify -t coffeeify src/DataProjector.coffee > DataProjector.js

Flask API
---------
The loading of selected articles and related articles is handled by `api.py`. The same repo for the frontend is the same as the Flask API. The `index.html` landing page is not configured to be served by Flask, but rather by the web server as static content in order to reduce the load on the application server we're been using (uwsgi). You can configure your web server to point `/guardian-galaxy-api` to an application server (uwsgi) serving `api.py`. This is an example of what the nginx configuration could look like:

    location /guardian-galaxy {

        if ($request_uri ~* ".(jpg|jpeg|gif|gz|zip|flv|rar|wmv|avi|css|swf|png|htc|ico|mpeg|mpg|txt|mp3|mov|js)(\?v=[0-9.]+)?$") {
            expires 1h;
            add_header Cache-Control "public";
            add_header X-Cache $upstream_cache_status;
            access_log off;
            break;
        }
    }

    location /guardian-galaxy-api {
        include uwsgi_params;
        uwsgi_pass unix:/home/ubuntu/www/dbrslabs-splash/guardian-galaxy-api/api.sock;
    }

A bunch of .d2v files need to be copies to `/ml/doc2vec/models/final/`. Those are outside git and must be copied in there manually.

There are numerous python dependencies that need to be installed in order for `api.py` to work. To install them:

    $ virtualenv venv
    $ source venv/bin/activate
    $ pip install scipy==0.18.0
    $ pip install -r web-requirements.txt
    $ python api.py

As noted in that third step, scipy has to be installed before the other requirements due to not-totally-understood reasons.

To get uwsgi up and running, there's some configuration files available that can be modified for operating systems that use upstart and well as systemd:

`deploy\upstart\guardian-galaxy-api.conf`: This lives in /etc/init/guardian-galaxy-api.conf on the server.

`deploy\systemd\guardian-galaxy-api.service`: For the systemd future of Ubuntu 16+.