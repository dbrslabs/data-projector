# simple server that talks to a mongo backend

# mongo
from pymongo import MongoClient
client = MongoClient('mongodb://ec2-54-88-15-234.compute-1.amazonaws.com')
db = client.guardian.articlesv2
from bson.objectid import ObjectId

# flask
from flask import Flask, jsonify, request
from flask.ext.cors import CORS, cross_origin

# doc2vec
from gensim.models import Doc2Vec
# TODO load all models into lookup dict, change front-end to see many t-sne data.json
d2v = Doc2Vec.load('ml/doc2vec/models/articles-sections-Science/dm1-mincount5-window8-size100-sample1e-05-neg0.d2v')

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

@app.route("/doc/<docid>", methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc(docid):
    try:
        article = db.find_one({'_id': ObjectId(docid)})
        return jsonify(format_article(article))
    except Exception as err:
        pass

@app.route("/doc/<docid>/most_similar", methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc_most_similar(docid):
    try:
        similar_docids, similarities = zip(*d2v.docvecs.most_similar(docid))
        articles = db.find({'_id': { '$in': [ObjectId(docid) for docid in similar_docids] }})
        # evaluate mongo cursor and format articles
        articles = [format_article(a) for a in articles]
        # re-order what mongo gave us to match similar_docids and similarity order
        order = [similar_docids.index(a['id']) for a in articles]
        articles = [article for _, article in sorted(zip(order,articles))]
        # set doc2vec similarity of each article
        articles = [dict(art.items() + [('similarity',sim)]) for art,sim in zip(articles,similarities)]
        return jsonify({'most_similar': articles})
    except Exception as err:
        pass


if __name__ == "__main__":
    app.run()
