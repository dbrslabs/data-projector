# simple server that talks to a mongo backend

# python
from urlparse import urlparse
from urllib import urlencode
import json

# mongo
from pymongo import MongoClient
client = MongoClient('mongodb://52.5.180.63') # elastic ip of mongo-dev
db = client.guardian.articlesv2
from bson.objectid import ObjectId

# flask
from flask import Flask, jsonify, request
from flask.ext.cors import CORS, cross_origin

# doc2vec
from gensim.models import Doc2Vec
from gensim.models.doc2vec import TaggedDocument
# TODO load all models into lookup dict, change front-end to see many t-sne data.json
d2v = Doc2Vec.load('ml/doc2vec/models/articles-sections-Science/dm1-mincount5-window8-size100-sample1e-05-neg0.d2v')
init_rng_state = d2v.random.get_state()

# 3rd party
import requests

app = Flask(__name__)
app.config['CORS_HEADERS'] = "Content-Type"
cors = CORS(app, resources={r"/*": {"origins": 'localhost'}})

def format_article(article):
    return {
        'id': str(article['_id']),
        'text': article['blocks']['body'][0]['bodyTextSummary'],
        'html': article['blocks']['body'][0]['bodyHtml'],
        # TODO shortened title?
        'title': article['webTitle'],
        'url': article['webUrl'],
    }

@app.route("/", methods=['GET'])
def sanitytest():
    return "<p>airhornsounds.wav</p>"

@app.route("/doc/<docid>", methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc(docid):
    try:
        article = db.find_one({'_id': ObjectId(docid)})
        return jsonify(format_article(article))
    except Exception as err:
        pass

def most_similar(docid_or_vector):
    '''query doc2vec model to find (ids,similarities) of the most similar documents'''
    similar_docids, similarities = zip(*d2v.docvecs.most_similar([docid_or_vector], topn=5))
    return similar_docids, similarities

def get_docs_by_ids(docids):
    # retrieve documents from mongo and format
    docs = []
    for _id in docids:
        doc = db.find_one({'_id': ObjectId(_id)})
        docs.append(format_article(doc))
    return docs

def merge_docs_and_similarities(docs, similarities):
    # set doc2vec similarity of each article
    docs = [dict(art.items() + [('similarity',sim)]) for art,sim in zip(docs,similarities)]
    return docs

@app.route("/doc/<docid>/most_similar", methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc_most_similar(docid):
    try:
        similar_docids, similarities = most_similar(docid)
        similar_docs = get_docs_by_ids(similar_docids)
        similar_docs = merge_docs_and_similarities(similar_docs, similarities)
        return jsonify({'most_similar': similar_docs})
    except Exception as err:
        pass


@app.route("/url/most_similar", methods=['POST'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_url_most_similar():
    try:
        # extract url from payload
        content = request.get_json()
        url = content['url']

        # get text of document url using Guardian api
        params = {
            'api-key':'e49965fd-587d-4b44-913d-6fd32587b515',
            'show-fields': 'all',
            'show-blocks': 'body',
        }
        apiurl = "http://content.guardianapis.com{path}?{query}".format(
            path=urlparse(url).path,
            query = urlencode(params),
        )
        res = requests.get(apiurl)
        text = json.loads(res.content)['response']['content']['blocks']['body'][0]['bodyTextSummary']
        print json.loads(res.content)['response']['content']['webTitle']

        # preprocess text in the same manner as doc2vec training
        # TODO *import* these preprocess functions from doc2vec/doc2vec.py
        import string; printable = set(string.printable)
        text = filter(lambda x: x in printable, text) # strip_punct
        text = text.lower() # lower case

        # get doc2vec vector given the document text
        tagged_text = TaggedDocument(words=text.split(), tags=['N/A'])
        # for deterministic infer_vector, setting the d2v seed is
        # required until infer_vector seed feature released
        d2v.random.set_state(init_rng_state)
        vec = d2v.infer_vector(tagged_text.words)

        # find most similar docs by vector
        similar_docids, similarities = most_similar(vec)
        similar_docs = get_docs_by_ids(similar_docids)
        similar_docs = merge_docs_and_similarities(similar_docs, similarities)
        return jsonify({'most_similar': similar_docs})
    except Exception as err:
        pass

if __name__ == "__main__":
    app.run(host='0.0.0.0')
