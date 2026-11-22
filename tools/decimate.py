import numpy as np, sys
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
def decimate(pos,nrm,uv,idx,h,extra=None):
    n=len(pos)
    # weld exact-duplicate positions for position keys
    # islands
    r=np.concatenate([idx[:,0],idx[:,1],idx[:,2]]); c=np.concatenate([idx[:,1],idx[:,2],idx[:,0]])
    G=coo_matrix((np.ones(len(r),np.int8),(r,c)),shape=(n,n))
    nis,isl=connected_components(G,directed=False)
    cell=np.floor(pos/h).astype(np.int64)
    ax=np.argmax(np.abs(nrm),1); sg=(np.take_along_axis(nrm,ax[:,None],1)[:,0]>0).astype(np.int64)
    nb=ax*2+sg
    key=((cell[:,0]+5000)*20000+(cell[:,1]+5000))*20000+(cell[:,2]+5000)
    key=key*6+nb
    if extra is not None: key=key*8+extra.astype(np.int64)
    _,prep=np.unique(key,return_inverse=True)
    k2=prep.astype(np.int64)*(nis+1)+isl
    _,urep=np.unique(k2,return_inverse=True)
    nu=urep.max()+1; npr=prep.max()+1
    cnt=np.bincount(prep,minlength=npr)
    P=np.stack([np.bincount(prep,pos[:,i],npr) for i in range(3)],1)/cnt[:,None]
    EX=np.zeros(npr,np.int64)
    if extra is not None: EX[prep]=extra
    cu=np.bincount(urep,minlength=nu)
    U=np.stack([np.bincount(urep,uv[:,i],nu) for i in range(2)],1)/cu[:,None]
    u2p=np.zeros(nu,np.int64); u2p[urep]=prep
    F=urep[idx]; Fp=u2p[F]
    ok=(Fp[:,0]!=Fp[:,1])&(Fp[:,1]!=Fp[:,2])&(Fp[:,0]!=Fp[:,2])
    F=F[ok]
    Fs=np.sort(F,1); _,ui=np.unique(Fs,axis=0,return_index=True); F=F[np.sort(ui)]
    used=np.unique(F); remap=-np.ones(nu,np.int64); remap[used]=np.arange(len(used))
    F=remap[F]; u2p=u2p[used]; U=U[used]
    # compact posreps
    pu=np.unique(u2p); pm=-np.ones(npr,np.int64); pm[pu]=np.arange(len(pu)); u2p=pm[u2p]; P=P[pu]; EX=EX[pu]
    V=P[u2p]
    # normals per posrep
    e1=V[F[:,1]]-V[F[:,0]]; e2=V[F[:,2]]-V[F[:,0]]; fn=np.cross(e1,e2)
    # normals: average the ORIGINAL high-poly normals inside each cluster (clusters are already split by
    # normal direction, so this never cancels out); fall back to face normals only where that is degenerate
    ON=np.stack([np.bincount(prep,nrm[:,i].astype(np.float64),npr) for i in range(3)],1)[pu]
    FN=np.zeros_like(P)
    for k in range(3): np.add.at(FN,u2p[F[:,k]],fn)
    l=np.linalg.norm(ON,axis=1,keepdims=True)
    PN=np.where(l>1e-6, ON/(l+1e-12), FN/(np.linalg.norm(FN,axis=1,keepdims=True)+1e-12))
    # flip faces whose winding disagrees with their vertices' normals, so culling and shading agree
    fnn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]])
    vn=PN[u2p[F[:,0]]]+PN[u2p[F[:,1]]]+PN[u2p[F[:,2]]]
    flip=np.sum(fnn*vn,1)<0
    F[flip]=F[flip][:,[0,2,1]]
    print('   flipped faces', int(flip.sum()), 'of', len(F))
    return dict(pos=V.astype(np.float32),nrm=PN[u2p].astype(np.float32),uv=U.astype(np.float32),idx=F.astype(np.uint32),prep=u2p,P=P.astype(np.float32),islands=nis,region=EX)
