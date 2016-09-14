# simple server that talks to a mongo backend

# python
from urlparse import urlparse
from urllib import urlencode
import json
import os.path

# mongo
from pymongo import MongoClient
client = MongoClient('mongodb://52.5.180.63') # elastic ip of mongo-dev
db = client.guardian.articlesv2
from bson.objectid import ObjectId

# flask
from flask import Flask, jsonify, request
#from flask_cors import CORS, cross_origin
from flask.ext.cors import CORS, cross_origin

# 3rd party
import requests

# doc2vec
from gensim.models import Doc2Vec
from gensim.models.doc2vec import TaggedDocument

# load all doc2vec models for all sections
# NOTE: final diretory not commited to git. get from someone
d2v = {}
d2v_dir = 'ml/doc2vec/models/final'
for filename in os.listdir(d2v_dir):
    model_path = os.path.join(d2v_dir,filename)
    # the filename without extension is the section name
    section = os.path.splitext(filename)[0]
    d2v[section] = Doc2Vec.load(model_path)

application = Flask(__name__)
application.config['CORS_HEADERS'] = "Content-Type"
cors = CORS(application, resources={r"/*": {"origins": 'localhost'}})

def format_article(article):
    return {
        'id': str(article['_id']),
        'text': article['blocks']['body'][0]['bodyTextSummary'],
        'html': article['blocks']['body'][0]['bodyHtml'],
        # TODO shortened title?
        'title': article['webTitle'],
        'url': article['webUrl'],
    }

@application.route("/guardian-galaxy-api", methods=['GET'])
def sanitytest():
    return "<p>airhornsounds.wav</p>"

#@application.route("/doc/<docid>", methods=['GET']) #dev
@application.route("/guardian-galaxy-api/doc/<docid>", methods=['GET']) #prod
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc(docid):
    try:
        article = db.find_one({'_id': ObjectId(docid)})
        return jsonify(format_article(article))
    except Exception as err:
        pass

def most_similar(docid_or_vector, section):
    '''query doc2vec model to find (ids,similarities) of the most similar documents'''
    similar_docids, similarities = zip(*d2v[section].docvecs.most_similar([docid_or_vector], topn=5))
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

#@application.route("/doc/<docid>/most_similar", methods=['GET']) #dev
@application.route("/guardian-galaxy-api/doc/<docid>/section/<section>/most_similar", methods=['GET']) #prod
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc_most_similar(docid, section):
    try:
        similar_docids, similarities = most_similar(docid, section)
        similar_docs = get_docs_by_ids(similar_docids)
        similar_docs = merge_docs_and_similarities(similar_docs, similarities)
        return jsonify({'most_similar': similar_docs})
    except Exception as err:
        pass


if __name__ == "__main__":
    application.run(host='0.0.0.0')
