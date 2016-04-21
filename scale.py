'''scales data.json to fit data-projector'''

import json, itertools

# import data points
with open('data.json','r') as fp: data = json.load(fp)

# find the furthest deviance from the origin along the axes and scale using
points = [[i['x'],i['y'],i['z']] for i in data['points']]
maxabs = max(map(abs,itertools.chain(*points)))
scale = 100 / maxabs

# scale data
data = { 'points': [{
            'x'     : point['x'] * scale,
            'y'     : point['y'] * scale,
            'z'     : point['z'] * scale,
            'cid'   : point['cid'],
            'docid' : point['docid'],
        } for point in data['points']] }

# output to json
with open('data.json','w') as fp: json.dump(data,fp)
