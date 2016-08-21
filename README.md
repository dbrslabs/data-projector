data-projector
==============
A visual exploration of document similarity and clustering performed on Guardian articles.

Note: the beautiful frontend was [created by DataCritic](ec2-54-88-15-234.compute-1.amazonaws.com).

The dev and prod environments are totes different, so until we come up with a more elegant way of switching out URLs for dev and prod environments, you'll have to manually change the API URLs in these files (look for lines with #dev and #prod):

* src/SidePanel.coffee
* api.py

To rebuild from coffeescript source:

    $ npm install
    $ node_modules/.bin/browserify -t coffeeify src/DataProjector.coffee > DataProjector.js

To serve index.html:

    $ python -m SimpleHTTPServer

You also need to serve the api if you want to access the Guardian-article-content and most-similar-articles endpoints. 
First install all python dependencies and then run the flask server:

    $ virtualenv venv
    $ source venv/bin/activate
    $ pip install -r web-requirements.txt
    $ python api.py

If you are planning do throw down some machine learning biz, you'll want to install all the math libraries in `ml-requirements.txt` instead of just `web-requirements.txt`:

    $ pip install -r ml-requirements.txt

You can run doc2vec and tsne to generate your own `data.json`. An example of doc2vec:

    $ python ml/doc2vec/doc2vec.py --min_count 5 --size 100 --corpus ml/guardian/data/articles-sections-Science

Where `articles-sections-Science` is a file with each line formatted as such `<id> <article content>`, e.g. 56f2cca6d4f5ca1daea21d63 three scientists-two british and one american ...

You can use your own corpus of articles or use Guardian articles from our mongo db:

    $ python ml/guardian/get_training_data.py --sections [Science,Technology]

This will output a flat file, specifically formatted for doc2vec, to `ml/guardian/data/articles-sections-Science-Technology`.

To reduce the dimensionality of doc2vec to 2 or 3 dimensions, use t-sne (which includes k-means clustering):

    $ python ml/tsne/tsne.py --clusters 8 12 --components 3 --doc2vec doc2vec/models/articles-sections-Science/dm1-mincount5-window8-size100-sample1e-05-neg0.d2v

You can also produce a t-sne animation with `--animate` and load t-sne vectors from `ml/tsne/vecs/<doc2vec-model>` using `--load`.

Last, use `dump.py` to generate `data.json` from the doc2vec and t-sne models:

    $ %run dump.py --doc2vec doc2vec/models/articles-sections-Science/dm1-mincount5-window8-size100-sample1e-05-neg0.d2v --components 3

To learn more about available cmdline args for `tsne.py`, `doc2vec.py`, `get_training_data.py`, and `dump.py` use `--help`.
