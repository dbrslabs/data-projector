'''simple script to add article information to data.json after t-sne is run'''

# python libs
import json, itertools, argparse

# 3rd party
from pymongo import MongoClient
from bson.objectid import ObjectId


# C M D L I N E   A R G U M E N T S

parser = argparse.ArgumentParser(description='output data.json for use in data-projection front-end')
parser.add_argument('--host', default='localhost', type=str, help='mongo host')
parser.add_argument('--doc2vec', required=True, help='doc2vec model used when t-sne was run')
parser.add_argument('--components', default=2, type=int, help='dimensionality of t-sne run')
parser.add_argument('--seed', default=20150101, type=int, help='seed that t-sne was run with')
parser.add_argument('--clusters', type=int, default=9, help='number of clusters')
parser.add_argument('--output', type=str, default='data.json', help='data output json file')

arg = parser.parse_args()

assert arg.components in [2,3], 't-SNE must have 2 or 3 components'

# I M P O R T _ D A T A

# connect to mongoDB, get articles collection
client = MongoClient('mongodb://{host}'.format(**vars(arg)))
tsne = client.tsne.tsne
articles = client.guardian.articlesv2

# with open('data.json','r') as fp: data = json.load(fp)
query = { 'doc2vec': arg.doc2vec, 'components': arg.components, 'seed' : arg.seed, 'clusters': arg.clusters }
data = tsne.find_one(query)

#ids = [pt['doc']['id'] for pt in data['points']]
#articles.find({'_id': { '$in': map(ObjectId, ids) }})

# S C A L E _ P T S

# find the furthest deviance from the origin along the axes and scale using
points = [[i['x'],i['y'],i['z']] for i in data['points']]
maxabs = max(map(abs,itertools.chain(*points)))
scale = 100 / maxabs

points = []
for point in data['points']:
    docid = point['document']['id']
    article = articles.find_one({'_id': ObjectId(docid)})
    # format data-projector expects
    points.append({
        'x': point['x'] * scale,
        'y': point['y'] * scale,
        'z': point['z'] * scale,
        'cid': point['cluster'],
        'document': {
            'id': docid,
            'title': article['webTitle'],
        }
    })

# output to json
with open(arg.output,'w') as fp:
    json.dump({'points': points}, fp)
