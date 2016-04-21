# augmented from Cyrille Rossant's and O'Reilly's blog post: 
# https://www.oreilly.com/learning/an-illustrated-introduction-to-the-t-sne-algorithm
import logging, argparse, os, multiprocessing, json
from datetime import datetime
from functools import partial
from glob import glob

import numpy as np
from numpy import linalg
from numpy.linalg import norm
from scipy.spatial.distance import squareform, pdist

# sklearn
import sklearn
from sklearn.manifold import TSNE
from sklearn.datasets import load_digits
from sklearn.preprocessing import scale
from sklearn.cluster import KMeans

# sklearn 0.17.1 for monkey patching
from sklearn.metrics.pairwise import pairwise_distances
from sklearn.manifold.t_sne import _joint_probabilities, _kl_divergence
from sklearn.utils.extmath import _ravel

# matplotlib for graphics
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.patheffects as PathEffects
import matplotlib

# seaborn for pretty plots
import seaborn as sns
sns.set_style('white')
sns.set_palette('muted')
sns.set_context("notebook", font_scale=1.5, rc={"lines.linewidth": 2.5})

# moviepy for animations
from moviepy.video.io.bindings import mplfig_to_npimage
import moviepy.editor as mpy

def scatter(x, colors):
    # We choose a color palette with seaborn.
    n_colors = len(set(colors))
    palette = np.array(sns.color_palette("husl", n_colors))

    # We create a scatter plot.
    fig = plt.figure(figsize=(8, 8))
    ax = plt.subplot(aspect='equal')
    scat = ax.scatter(x[:,0], x[:,1], lw=0, s=40, c=palette[colors.astype(np.int)])
    plt.xlim(-25, 25)
    plt.ylim(-25, 25)
    ax.axis('off')
    ax.axis('tight')

    # We add the labels for each digit.
    txts = []
    ''' 
    # TODO fix text.py bug with matplotlib. passing in NaN as labels when doing median
    for i in range(n_colors):
        # Position of each label.
        xtext, ytext = np.median(x[colors == i, :], axis=0)
        txt = ax.text(xtext, ytext, str(i), fontsize=24)
        txt.set_path_effects([
            PathEffects.Stroke(linewidth=5, foreground="w"),
            PathEffects.Normal()])
        txts.append(txt)
    '''
    return fig, ax, scat, txts

def scatter3(x, colors):
    # We choose a color palette with seaborn.
    n_colors = len(set(colors))
    palette = np.array(sns.color_palette("hls", n_colors))

    # We create a scatter plot.
    fig = plt.figure(figsize=(8, 8))
    ax = plt.subplot(projection='3d', aspect='equal')
    scat = ax.scatter(x[:,0], x[:,1], x[:,2], lw=0, s=4, c=palette[colors.astype(np.int)])

    # prettyify the graph a bit
    plt.tick_params(
            which='both',
            bottom='off',
            top='off',
            labelbottom='off',
            labeltop='off',
            labelright='off',
            labelleft='off',
            length=0)
    ax.axis('off')
    ax.axis('tight')
    ax.grid(False)

    # We add the labels for each digit.
    txts = []
    ''' 
    # TODO fix text.py bug with matplotlib. passing in NaN as labels when doing median
    for i in range(n_colors):
        # Position of each label.
        xtext, ytext = np.median(x[colors == i, :], axis=0)
        txt = ax.text(xtext, ytext, str(i), fontsize=24)
        txt.set_path_effects([
            PathEffects.Stroke(linewidth=5, foreground="w"),
            PathEffects.Normal()])
        txts.append(txt)
    '''
    return fig, ax, scat, txts

def _gradient_descent(objective, p0, it, n_iter, objective_error=None,
                      n_iter_check=1, n_iter_without_progress=50,
                      momentum=0.5, learning_rate=1000.0, min_gain=0.01,
                      min_grad_norm=1e-7, min_error_diff=1e-7, verbose=0,
                      args=None, kwargs=None):
    '''monkey patched sklearn v0.17.1: sklearn.manifold.t_sne.__gradient_descent method.'''
    if args is None:
        args = []
    if kwargs is None:
        kwargs = {}

    p = p0.copy().ravel()
    update = np.zeros_like(p)
    gains = np.ones_like(p)
    error = np.finfo(np.float).max
    best_error = np.finfo(np.float).max
    best_iter = 0

    for i in range(it, n_iter):
        # We save the current position.
        global positions
        positions.append(p.copy())

        new_error, grad = objective(p, *args, **kwargs)
        grad_norm = linalg.norm(grad)

        inc = update * grad >= 0.0
        dec = np.invert(inc)
        gains[inc] += 0.05
        gains[dec] *= 0.95
        np.clip(gains, min_gain, np.inf)
        grad *= gains
        update = momentum * update - learning_rate * grad
        p += update

        if (i + 1) % n_iter_check == 0:
            if new_error is None:
                new_error = objective_error(p, *args)
            error_diff = np.abs(new_error - error)
            error = new_error

            if verbose >= 2:
                m = "[t-SNE] Iteration %d: error = %.7f, gradient norm = %.7f"
                print(m % (i + 1, error, grad_norm))

            if error < best_error:
                best_error = error
                best_iter = i
            elif i - best_iter > n_iter_without_progress:
                if verbose >= 2:
                    print("[t-SNE] Iteration %d: did not make any progress "
                          "during the last %d episodes. Finished."
                          % (i + 1, n_iter_without_progress))
                break
            if grad_norm <= min_grad_norm:
                if verbose >= 2:
                    print("[t-SNE] Iteration %d: gradient norm %f. Finished."
                          % (i + 1, grad_norm))
                break
            if error_diff <= min_error_diff:
                if verbose >= 2:
                    m = "[t-SNE] Iteration %d: error difference %f. Finished."
                    print(m % (i + 1, error_diff))
                break

        if new_error is not None:
            error = new_error

    return p, error, i

if __name__ == '__main__':
    from gensim.models import Doc2Vec

    # L O G G I N G

    # setup custom logging
    logfile = '{abspath}/logs/{time}.log'.format(
        abspath = os.path.dirname(os.path.abspath(__file__)),
        time = datetime.now())
    logging.basicConfig(filename=logfile, level=logging.WARNING)

    # C M D L I N E   A R G U M E N T S

    parser = argparse.ArgumentParser(description='t-SNE on doc2vec embeddings including visualization of convergence')
    parser.add_argument('--doc2vec', required=True, help='file path to doc2vec vectors')
    parser.add_argument('--components', default=2, type=int, help='t-sne dimensionality')
    parser.add_argument('--load', action='store_true', help='use pre-calculated t-SNE vectors and positions. dont run full t-sne')
    parser.add_argument('--seed', default=20150101, type=int, help='pass deterministic seed to t-sne')
    parser.add_argument('--ops', nargs='+', type=str, default=['tojson'], help='operations to perform. presently avail: animate, tojson')
    parser.add_argument('--clusters', nargs='+', type=int, default=[], help='range of cluster counts on which to run k-means')
    arg = parser.parse_args()

    assert arg.components in [2,3], 't-SNE must have 2 or 3 components'

    if 'tojson' in arg.ops and arg.components == 2:
        logging.warning('data-projector requires json point to have 3 components')

    # D I R E C T O R Y  P R E P

    # get the directory in which this file resides
    thisdir = os.path.abspath(os.path.dirname(__file__))

    # create vecs directory for storing outputs
    vecsdir = os.path.join(thisdir, 'vecs')
    if not os.path.exists(vecsdir): os.makedirs(vecsdir)

    # create storage directory named after doc2vec file used
    storagedir = os.path.join(vecsdir, os.path.basename(arg.doc2vec))
    if not os.path.exists(storagedir): os.makedirs(storagedir)

    base = os.path.join(storagedir, 'dims{components}-seed{seed}-'.format(**vars(arg)))
    projection_file = base + 'projection.npy'
    positions_file = base + 'positions.npy'

    # T - S N E

    # load doc2vec vectors from file path and grab embedded representations
    d2v = Doc2Vec.load(arg.doc2vec)
    docids = d2v.docvecs.doctags.keys()
    X = np.vstack([d2v.docvecs[tag] for tag in docids])

    if (arg.load): # read in pre-calculated t-sne vectors and animated positions from disk
        X_proj = np.load(projection_file)
        positions = np.load(positions_file)

    else: # run t-sne on vector space
        # record point positions on every iteration of t-SNE
        global positions
        positions = []

        # monkey patch sklearn's _gradient_descent method to capture point positions during t-sne
        sklearn.manifold.t_sne._gradient_descent = _gradient_descent

        # t-SNE!
        print 'running t-sne'
        X_proj = TSNE(arg.components, random_state=arg.seed).fit_transform(X)

        # write calculations to disk
        with open(projection_file, 'w') as f: np.save(f, X_proj)
        with open(positions_file, 'w') as f: np.save(f, positions)

    # K - M E A N S

    # reshape t-SNE positions for graphing
    X_iter = np.dstack(position.reshape(-1, arg.components) for position in positions)

    # get range of cluster counts
    n_clusters_range = range(*arg.clusters) if arg.clusters else range(6,13)

    # perform k-means on the document vectors
    # these high-dimensional clusters will be our coloring scheme of the dimensionally reduced vectors
    for n_clusters in n_clusters_range:
        print 'k-means. num clusters:', n_clusters
        kmeans = KMeans(n_clusters=n_clusters,
                        precompute_distances=True, 
                        n_jobs=multiprocessing.cpu_count())
        kmeans.fit(X)
        y = kmeans.labels_

        # T O   J S O N

        if 'tojson' in arg.ops:
            with open('data.json', 'w') as out:
                points, clusters = X_iter[..., -1].tolist(), y.tolist()
                data = { 'points' : [{'x':p[0], 'y':p[1], 'z':p[2], 'cid':c, 'docid':d} for p,c,d in zip(points,clusters,docids)] }
                json.dump(data, out)

        # A N I M A T I O N

        if 'animate' in arg.ops:
            # create scatter plot animation of t-SNE converging
            fig, ax, scat, txts = scatter3(X_iter[..., -1], y)
            def make_tsne_frame(t):
                i = int(t*40)
                x = X_iter[..., i]
                if arg.components == 2:
                    scat.set_offsets(x)
                else: # components = 3D
                    # manually set private offsets bc: matplotlib is stupid
                    x = np.swapaxes(x,0,1).tolist()
                    scat._offsets3d = x
                ''' TODO
                for j, txt in zip(range(10), txts):
                    xtext, ytext = np.median(x[y == j, :], axis=0)
                    txt.set_x(xtext)
                    txt.set_y(ytext)
                '''
                return mplfig_to_npimage(fig)
            animation = mpy.VideoClip(make_tsne_frame, duration=X_iter.shape[2]/40.)
            # TODO dynamically mkdir for imgs/<d2v-model>/*
            animation.write_gif("imgs/tsne3-animation-clusters{}.gif".format(n_clusters), fps=20)
