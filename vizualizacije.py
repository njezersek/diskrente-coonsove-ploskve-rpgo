import numpy as np
from matplotlib import pyplot as plt
from coons import *


def construct_example(m=11, n=9):
	phi = np.linspace(-np.pi/2, np.pi/2, m)
	theta = np.linspace(-np.pi/2, np.pi/2, n)

	P = np.full((m, n, 3), np.nan)
	P[:,0,:] = np.array((-1-np.cos(phi), np.sin(phi), np.zeros(m))).T # left
	P[:,-1,:] = np.array((1+np.cos(phi), np.sin(phi), np.zeros(m))).T # right
	P[0,:,:] = np.array((np.sin(theta), -np.ones(n), np.cos(theta))).T # top
	P[-1,:,:] = np.array((np.sin(theta), np.ones(n), np.cos(theta))).T # bottom
	return P

P = construct_example()


# best_alpha, alphas, err = optimize_alpha(P.copy())
# print(f"{best_alpha = }")

# plt.figure()
# plt.plot(alphas, err)
# plt.yscale('log')
# plt.xlabel("$\\alpha$")
# plt.ylabel("Napaka")
# plt.show()

best_alpha = -0.2593

P_coons = coons3(P.copy(), construct_mask(-0.25))

P_opt = coons3(P.copy(), construct_mask(best_alpha))

fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(121, projection='3d')
ax.plot_wireframe(P[:,:,0], P[:,:,1], P[:,:,2], color='black')
ax.plot_surface(P_coons[:,:,0], P_coons[:,:,1], P_coons[:,:,2], color='tab:blue', alpha=0.9)
ax.set_aspect('equal')
ax.set_title("$\\alpha = -0.25\\ (Coons)$")

ax = fig.add_subplot(122, projection='3d')
ax.plot_wireframe(P[:,:,0], P[:,:,1], P[:,:,2], color='black')
ax.plot_surface(P_opt[:,:,0], P_opt[:,:,1], P_opt[:,:,2], color='tab:blue', alpha=0.9)
ax.set_aspect('equal')
ax.set_title(f"$\\alpha = {best_alpha:0.4f}\\ (optimizirana)$")
plt.show()

def construct_example2(m=11, n=9):
	phi = np.linspace(-np.pi/2, np.pi/2, m)
	theta = np.linspace(-np.pi/2, np.pi/2, n)

	P = np.full((m, n, 3), np.nan)
	P[:,0,:] = np.array((-1+np.cos(phi), np.sin(phi), np.zeros(m))).T # left
	P[:,-1,:] = np.array((1-np.cos(phi), np.sin(phi), np.zeros(m))).T # right
	P[0,:,:] = np.array((np.sin(theta), -np.ones(n), np.cos(theta))).T # top
	P[-1,:,:] = np.array((np.sin(theta), np.ones(n), np.cos(theta))).T # bottom
	return P

P = construct_example2()


# best_alpha, alphas, err = optimize_alpha(P.copy())
# print(f"{best_alpha = }")

# plt.figure()
# plt.plot(alphas, err)
# plt.yscale('log')
# plt.xlabel("$\\alpha$")
# plt.ylabel("Napaka")
# plt.show()

best_alpha = -0.1572

P_coons = coons3(P.copy(), construct_mask(-0.25))

P_opt = coons3(P.copy(), construct_mask(best_alpha))

fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(121, projection='3d')
ax.plot_wireframe(P[:,:,0], P[:,:,1], P[:,:,2], color='black')
ax.plot_surface(P_coons[:,:,0], P_coons[:,:,1], P_coons[:,:,2], color='tab:blue', alpha=0.9)
ax.set_aspect('equal')
ax.set_title("$\\alpha = -0.25\\ (Coons)$")

ax = fig.add_subplot(122, projection='3d')
ax.plot_wireframe(P[:,:,0], P[:,:,1], P[:,:,2], color='black')
ax.plot_surface(P_opt[:,:,0], P_opt[:,:,1], P_opt[:,:,2], color='tab:blue', alpha=0.9)
ax.set_aspect('equal')
ax.set_title(f"$\\alpha = {best_alpha:0.4f}\\ (optimizirana)$")
plt.show()