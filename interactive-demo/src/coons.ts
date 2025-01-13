import { lusolve, Matrix, matrix, zeros } from "mathjs";

export function construct_mask(a: number, b: number){
	return matrix([
		[a, b, a],
		[b,-1, b],
		[a, b, a]
	])
}

/**
 * Fill the inner `points` with discrete coons method.
 * 
 * `points` should be a 2d matrix with scalar values
 * `mask` should be a 3x3 matrix with coefficients and -1 in the middle
 */
export function coons(points: Matrix, mask: Matrix){
	const [m, n] = points.size()

	const unknowns = (n-2)*(m-2)
	const A = zeros([unknowns, unknowns]) as number[][]
	const B = zeros([unknowns]) as number[]

	const cell_to_col = (i: number, j: number) => (i-1)*(n-2) + (j-1); 
	const col_to_cell = (c: number) => [Math.floor(c / (n-2))+1, (c % (n-2))+1]

	for(let i=1; i<m-1; i++){
		for(let j=1; j<n-1; j++){
			// set the equation coeffs for unknown control point
			for(let y=-1; y<=1; y++){
				for(let x=-1; x<=1; x++){
					let k = mask.get([y+1, x+1])
					if(0 < i+y && i+y < m-1 && 0 < j+x && j+x < n-1){
						A[cell_to_col(i, j)][cell_to_col(i+y, j+x)] += k
					}
					else{
						B[cell_to_col(i, j)] -= k * points.get([i+y, j+x])
					}
				}
			}
		}
	}

	const sol = lusolve(matrix(A), matrix(B))
	for(let c=0; c<unknowns; c++){
		const [i, j] = col_to_cell(c)
		points.set([i, j], sol.get([c, 0]))
	}
}

if(import.meta.vitest){
	const { it, expect } = import.meta.vitest

	it("coons", () => {
		const points = matrix([
			[1,2,2,1],
			[1,0,0,1],
			[1,0,0,1],
			[1,2,2,1]
		])

		const mask = construct_mask(-0.25, 0.5)

		coons(points, mask);

		const points_expected = matrix([
			[1,2,2,1],
			[1,2,2,1],
			[1,2,2,1],
			[1,2,2,1]
		])
		expect(points.toArray()).toEqual(points_expected.toArray())
	})

	it("points to mat", () => {
		let m = 3
		let n = 3
		let points = zeros([m, n]) as number[][]

		let top = [1, 2]
		let right = [3, 4]
		let bottom = [5, 6]
		let left = [7, 8]

		for(let j=0; j<m-1; j++){
			points[0][j] = top[j]
			points[m-1][m-j-1] = bottom[j]
		}
		for(let i=0; i<n-1; i++){
			points[i][n-1] = right[i]
			points[n-i-1][0] = left[i]
		}

		console.log(points)

	})
}