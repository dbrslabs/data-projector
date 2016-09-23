# simple server that talks to a mongo backend

# python
from urlparse import urlparse
from urllib import urlencode
import json
import os.path
import urllib3.contrib.pyopenssl

# mongo
from pymongo import MongoClient
client = MongoClient('mongodb://52.5.180.63') # elastic ip of mongo-dev
db = client.guardian
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
    # the filename without extension is the section name
    section, extension = os.path.splitext(filename)
    if extension == '.d2v':
        print 'loading doc2vec model: ', section
        model_path = os.path.join(d2v_dir,filename)
        d2v[section] = Doc2Vec.load(model_path)

application = Flask(__name__)
application.config['CORS_HEADERS'] = "Content-Type"
cors = CORS(application, resources={r"/*": {"origins": 'localhost'}})

def format_doc(article):
    return {
        'id': str(article['_id']),
        'text': article['blocks']['body'][0]['bodyTextSummary'],
        'html': article['blocks']['body'][0]['bodyHtml'],
        'title': article['webTitle'],
        'url': article['webUrl'],
    }


@application.route("/guardian-galaxy-api", methods=['GET'])
def sanitytest():
    return "<p>airhornsounds.wav</p>"


@application.route("/guardian-galaxy-api/doc/<docid>", methods=['GET']) #prod
#@application.route("/doc/<docid>", methods=['GET']) #dev
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc(docid):
    article = db.articlesv2.find_one({'_id': ObjectId(docid)})
    return jsonify(format_doc(article))


def get_docs_by_ids(docids):
    # retrieve documents from mongo and format
    docs = []
    for docid in docids:
        # get document metadata
        doc = db.articlesv2.find_one({'_id': ObjectId(docid)})
        doc = format_doc(doc)
        # get document cluster-membership information
        cluster_data = db.clusterid.find({'id': docid})[0]
        doc.update({'cid': cluster_data['cid'], 'section': cluster_data['section']})
        docs.append(doc)
    return docs


@application.route("/guardian-galaxy-api/doc/<docid>/section/<section>/most_similar", methods=['GET']) #prod
#@application.route("/doc/<docid>/section/<section>/most_similar", methods=['GET']) #dev
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc_most_similar(docid, section):
    # get the most similar document ids and their measures of similarity
    docids, sims = zip(*d2v[section].docvecs.most_similar([docid], topn=5))
    docs = get_docs_by_ids(docids)
    # merge similarities into the documents we are returning
    docs = [dict(similarity=s, **d) for s,d in zip(sims,docs)]
    return jsonify({'most_similar': docs})


if __name__ == "__main__":
    application.run(host='0.0.0.0')
