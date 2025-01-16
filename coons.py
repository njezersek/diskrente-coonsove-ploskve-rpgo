import numpy as np
from itertools import product

def construct_mask(a):
    b = 0.25 - a
    return np.array([
        [a, b, a],
        [b,-1, b],
        [a, b, a]
    ])


def coons(points: np.ndarray, mask: np.ndarray):
    m, n = points.shape
    unknowns = (n-2)*(m-2)
    A = np.zeros((unknowns, unknowns))
    B = np.zeros(unknowns)

    cell_to_col = lambda i, j: (i-1)*(n-2) + (j-1)
    col_to_cell = lambda c: (c // (n-2) + 1, c % (n-2)+1)

    for i, j in product(range(1,m-1), range(1,n-1)):
        for x, y in product(range(-1, 2), repeat=2):
            k = mask[y+1, x+1]
            if 0 < i+y < m-1 and 0 < j+x < n-1:
                A[cell_to_col(i, j)][cell_to_col(i+y, j+x)] += k
            else:
                B[cell_to_col(i,j)] -= k * points[i+y, j+x]


    sol = np.linalg.solve(A, B).flatten()
    for c, s in enumerate(sol):
        i, j = col_to_cell(c)
        points[i, j] = s

    return A

def coons3(P: np.ndarray, mask: np.ndarray):
    coons(P[:,:,0], mask)
    coons(P[:,:,1], mask)
    coons(P[:,:,2], mask)

    return P

def curve_angles(curve):
    segments = np.diff(curve, axis=0)  # Shape: (n-1, 3)
    segment_norms = np.linalg.norm(segments, axis=1, keepdims=True)
    normalized_segments = segments / segment_norms
    
    # Calculate angles between consecutive segments
    dot_products = np.sum(normalized_segments[:-1] * normalized_segments[1:], axis=1)
    angles = np.arccos(np.clip(dot_products, -1.0, 1.0))
    
    return angles


def error_function(P):
	def compute_error(get_slice, n):
		ref1 = curve_angles(get_slice(0))
		ref2 = curve_angles(get_slice(-1))
		err = np.zeros_like(ref1)
		for i in range(0, n):
			err += np.abs(curve_angles(get_slice(i)) - ref1)
			err += np.abs(curve_angles(get_slice(i)) - ref2)
		err /= n
		return err.sum()

	return compute_error(lambda i: P[:,i], P.shape[1]) + compute_error(lambda i: P[i,:], P.shape[0])

def optimize_alpha(P):
	def f(alpha):
		mask = construct_mask(alpha)
		coons(P[:,:,0], mask)
		coons(P[:,:,1], mask)
		coons(P[:,:,2], mask)

		return error_function(P)

	alphas = np.linspace(-1, 1, 1000)
	err = [f(a) for a in alphas]

	best_alpha = alphas[np.argmin(err)]

	return best_alpha, alphas, err