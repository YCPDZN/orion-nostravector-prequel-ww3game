"""Keyframed animation clips for the Orion humanoid rig.
Rest pose: identity rotations, arms hanging. Euler degrees applied as q = qY*qX*qZ.
Sign conventions (character faces +Z, left = +X):
  spine/head  +X = lean forward      Y+ = turn to character's left
  arm/leg     -X = swing forward     L arm +Z = out, R arm -Z = out
  knee        +X = bend              elbow -X = bend
"""
import math
FPS = 30
BONES = ['Hips','Spine','Chest','Neck','Head',
         'L_Shoulder','L_UpperArm','L_ForeArm','L_Hand',
         'R_Shoulder','R_UpperArm','R_ForeArm','R_Hand',
         'L_UpLeg','L_Leg','L_Foot','L_Toe',
         'R_UpLeg','R_Leg','R_Foot','R_Toe']

def P(**kw):
    return kw

def lerp_pose(a, b, t):
    out = {}
    for k in set(a) | set(b):
        va = a.get(k, 0 if k in ('hy','hz','hx') else (0,0,0))
        vb = b.get(k, 0 if k in ('hy','hz','hx') else (0,0,0))
        if isinstance(va, (int, float)):
            out[k] = va + (vb - va) * t
        else:
            out[k] = tuple(va[i] + (vb[i] - va[i]) * t for i in range(3))
    return out

def merge(*poses):
    out = {}
    for p in poses:
        out.update(p)
    return out

def ease(t):
    return t * t * (3 - 2 * t)

def keyed(keys, dur, loop=False):
    """keys: list of (time, pose, ease?)"""
    def f(t):
        if t <= keys[0][0]:
            return keys[0][1]
        for i in range(len(keys) - 1):
            t0, p0 = keys[i][0], keys[i][1]
            t1, p1 = keys[i + 1][0], keys[i + 1][1]
            if t0 <= t <= t1:
                u = (t - t0) / max(1e-6, t1 - t0)
                e = keys[i + 1][2] if len(keys[i + 1]) > 2 else 'smooth'
                if e == 'smooth': u = ease(u)
                elif e == 'in': u = u * u
                elif e == 'out': u = 1 - (1 - u) ** 2
                return lerp_pose(p0, p1, u)
        return keys[-1][1]
    return f, dur, loop

# ---------------- base stances -----------------
def legs_stance(k=1.0):
    return P(L_UpLeg=(-10*k, 0, 3), L_Leg=(18*k, 0, 0), L_Foot=(-8*k, 0, -3),
             R_UpLeg=(-4*k, 0, -3), R_Leg=(12*k, 0, 0), R_Foot=(-8*k, 0, 3), hy=-0.025*k)

SWORD_ARMS = P(R_UpperArm=(-22, -8, -10), R_ForeArm=(-55, 0, 0), R_Hand=(35, 0, 0),
               L_UpperArm=(-12, 0, 10), L_ForeArm=(-30, 0, 0), L_Hand=(0, 0, 0))
RIFLE_ARMS = P(R_UpperArm=(-12, 10, -18), R_ForeArm=(-85, 30, 0), R_Hand=(10, 0, 0),
               L_UpperArm=(-55, 25, 12), L_ForeArm=(-40, -10, 0), L_Hand=(0, 0, 0),
               Chest=(4, 12, 0), Head=(0, -12, 0))

def idle(arms, breathe=1.0):
    def f(t):
        s = math.sin(t / 2.4 * 2 * math.pi)
        p = merge(legs_stance(), arms)
        p['Spine'] = (4 + 1.0*s*breathe, 0, 0)
        c = p.get('Chest', (0, 0, 0)); p['Chest'] = (c[0] + 2.0*s*breathe, c[1], c[2])
        p['Neck'] = (-3 - 1.0*s, 0, 0)
        p['hy'] = p['hy'] - 0.006*(s+1)*breathe
        ra = p['R_UpperArm']; p['R_UpperArm'] = (ra[0] + 2*s, ra[1], ra[2])
        la = p['L_UpperArm']; p['L_UpperArm'] = (la[0] - 2*s, la[1], la[2] + 1.5*s)
        return p
    return f, 2.4, True

def locomotion(arms, period, stride, knee, lean, bob, armswing, arm_free):
    def f(t):
        ph = t / period * 2 * math.pi
        s, c = math.sin(ph), math.cos(ph)
        p = dict(arms)
        p['L_UpLeg'] = (-stride*s - 6, 0, 2)
        p['R_UpLeg'] = (stride*s - 6, 0, -2)
        # knee bends during swing phase (leg moving forward)
        p['L_Leg'] = (8 + knee*max(0.0, c) + 6*max(0.0, -c)*0.3, 0, 0)
        p['R_Leg'] = (8 + knee*max(0.0, -c) + 6*max(0.0, c)*0.3, 0, 0)
        p['L_Foot'] = (-6 + 12*s, 0, 0)
        p['R_Foot'] = (-6 - 12*s, 0, 0)
        p['Spine'] = (lean, 4*s, 0)
        ch = arms.get('Chest', (0, 0, 0))
        p['Chest'] = (ch[0] + lean*0.4, ch[1] - 7*s, ch[2])
        p['Head'] = (arms.get('Head', (0,0,0))[0] - lean*0.6, arms.get('Head', (0,0,0))[1] + 4*s, 0)
        p['hy'] = -0.03 - bob*abs(c) + bob*0.5
        p['hx'] = 0.012*s
        for side, sg in (('L', 1), ('R', -1)):
            if side in arm_free:
                a = arms[side+'_UpperArm']
                p[side+'_UpperArm'] = (a[0] + armswing*s*sg, a[1], a[2])
                fa = arms[side+'_ForeArm']
                p[side+'_ForeArm'] = (fa[0] - armswing*0.4*(1+s*sg)*0.5, fa[1], fa[2])
        return p
    return f, period, True

# ---------------- combat clips (sword) -----------------
def attack1():
    base = merge(legs_stance(), SWORD_ARMS)
    wind = merge(base, P(Chest=(0, -40, 0), Spine=(5, -15, 0), Head=(0, 30, 0),
                         R_UpperArm=(-10, -55, -80), R_ForeArm=(-50, 0, 0), R_Hand=(20, 0, -20),
                         L_UpperArm=(-40, 0, 25), L_ForeArm=(-50, 0, 0)))
    hit = merge(base, P(Chest=(8, 42, 0), Spine=(12, 18, 0), Head=(-8, -40, 0),
                        R_UpperArm=(-20, 85, -85), R_ForeArm=(-12, 0, 0), R_Hand=(10, 0, 20),
                        L_UpperArm=(5, 0, 30), L_ForeArm=(-25, 0, 0),
                        L_UpLeg=(-30, 0, 3), L_Leg=(30, 0, 0), L_Foot=(5, 0, 0),
                        R_UpLeg=(15, 0, -3), R_Leg=(15, 0, 0), R_Foot=(-15, 0, 0), hy=-0.07, hz=0.12))
    follow = merge(hit, P(Chest=(10, 50, 0), R_UpperArm=(-15, 100, -80), R_ForeArm=(-25, 0, 0)))
    return keyed([(0, base), (0.20, wind, 'out'), (0.34, hit, 'in'), (0.48, follow, 'out'), (0.85, base)], 0.85)

def attack2():
    base = merge(legs_stance(), SWORD_ARMS)
    wind = merge(base, P(Chest=(-6, 45, 0), Spine=(0, 15, 0), Head=(0, -35, 0),
                         R_UpperArm=(-150, 30, 10), R_ForeArm=(-30, 0, 0), R_Hand=(30, 0, 0),
                         L_UpperArm=(-20, 0, 20)))
    hit = merge(base, P(Chest=(25, -35, 0), Spine=(15, -15, 0), Head=(-20, 30, 0),
                        R_UpperArm=(-35, -40, -15), R_ForeArm=(-15, 0, 0), R_Hand=(15, 0, 0),
                        L_UpperArm=(0, 0, 35), L_ForeArm=(-20, 0, 0),
                        R_UpLeg=(-30, 0, -3), R_Leg=(30, 0, 0), R_Foot=(5, 0, 0),
                        L_UpLeg=(15, 0, 3), L_Leg=(15, 0, 0), L_Foot=(-15, 0, 0), hy=-0.08, hz=0.14))
    return keyed([(0, base), (0.22, wind, 'out'), (0.36, hit, 'in'), (0.5, hit), (0.9, base)], 0.9)

def heavy():
    base = merge(legs_stance(), SWORD_ARMS)
    wind = merge(base, P(Chest=(-18, 20, 0), Spine=(-10, 10, 0), Head=(10, -15, 0),
                         R_UpperArm=(-175, 10, 0), R_ForeArm=(-40, 0, 0), R_Hand=(20, 0, 0),
                         L_UpperArm=(-170, -15, 0), L_ForeArm=(-45, 0, 0),
                         L_UpLeg=(-20, 0, 3), L_Leg=(25, 0, 0), hy=-0.03))
    slam = merge(base, P(Chest=(35, 0, 0), Spine=(25, 0, 0), Head=(-25, 0, 0),
                         R_UpperArm=(-55, 10, -5), R_ForeArm=(-10, 0, 0), R_Hand=(25, 0, 0),
                         L_UpperArm=(-50, -15, 5), L_ForeArm=(-15, 0, 0),
                         L_UpLeg=(-45, 0, 3), L_Leg=(55, 0, 0), L_Foot=(-5, 0, 0),
                         R_UpLeg=(20, 0, -3), R_Leg=(30, 0, 0), R_Foot=(-20, 0, 0), hy=-0.17, hz=0.18))
    return keyed([(0, base), (0.45, wind, 'out'), (0.62, slam, 'in'), (0.9, slam), (1.35, base)], 1.35)

def roll():
    base = merge(legs_stance(), SWORD_ARMS)
    tuck = P(Spine=(50, 0, 0), Chest=(45, 0, 0), Neck=(25, 0, 0), Head=(20, 0, 0),
             L_UpLeg=(-100, 0, 8), L_Leg=(120, 0, 0), R_UpLeg=(-95, 0, -8), R_Leg=(125, 0, 0),
             L_UpperArm=(-70, 0, 20), L_ForeArm=(-90, 0, 0), R_UpperArm=(-60, 0, -20), R_ForeArm=(-90, 0, 0),
             R_Hand=(35, 0, 0), hy=-0.55)
    k = []
    # Hips pitch provides the actual rolling rotation (handled via Hips X)
    def f(t):
        u = t / 0.75
        if u < 0.12:
            p = lerp_pose(base, tuck, ease(u / 0.12))
        elif u < 0.72:
            p = dict(tuck)
        else:
            p = lerp_pose(tuck, base, ease((u - 0.72) / 0.28))
        r = 0.0
        if 0.08 < u < 0.78:
            r = 360 * ease((u - 0.08) / 0.70)
        p['Hips'] = (r, 0, 0)
        # lift hips so rolling body stays above ground (hips pivot)
        s = math.sin(min(1, max(0, (u - 0.08) / 0.7)) * math.pi)
        p['hy'] = p.get('hy', 0) * (1 - 0.35 * s) + 0.0
        return p
    return f, 0.75, False

def block():
    base = merge(legs_stance(1.3), SWORD_ARMS)
    g = merge(base, P(Chest=(8, -10, 0), Spine=(6, -5, 0),
                      R_UpperArm=(-75, 35, -10), R_ForeArm=(-70, 0, 0), R_Hand=(-10, 0, 40),
                      L_UpperArm=(-70, -25, 15), L_ForeArm=(-80, 0, 0), L_Hand=(0, 0, 0)))
    return keyed([(0, g), (1.0, g)], 1.0, True)

def hit():
    base = merge(legs_stance(), SWORD_ARMS)
    h = merge(base, P(Spine=(-18, 8, 0), Chest=(-15, 10, 0), Head=(-20, 0, 0),
                      L_UpperArm=(-10, 0, 35), R_UpperArm=(-10, -8, -30), hy=-0.04, hz=-0.08))
    return keyed([(0, base), (0.1, h, 'out'), (0.45, base)], 0.45)

def death():
    base = merge(legs_stance(), SWORD_ARMS)
    k1 = merge(base, P(Spine=(-20, 10, 0), Chest=(-15, 0, 0), Head=(-25, 0, 0),
                       L_UpLeg=(-20, 0, 3), L_Leg=(60, 0, 0), R_UpLeg=(-30, 0, -3), R_Leg=(80, 0, 0),
                       L_UpperArm=(-20, 0, 30), R_UpperArm=(-30, 0, -30), hy=-0.25))
    k2 = merge(base, P(Hips=(-80, 10, 0), Spine=(-5, 0, 0), Chest=(-5, 0, 0), Head=(-10, 25, 0),
                       L_UpLeg=(-30, 0, 10), L_Leg=(30, 0, 0), R_UpLeg=(-10, 0, -10), R_Leg=(10, 0, 0),
                       L_UpperArm=(-10, 0, 70), L_ForeArm=(-20, 0, 0),
                       R_UpperArm=(-10, 0, -60), R_ForeArm=(-10, 0, 0), hy=-0.82, hz=-0.35))
    return keyed([(0, base), (0.35, k1, 'out'), (0.95, k2, 'in'), (1.6, k2)], 1.6)

def heal():
    base = merge(legs_stance(), SWORD_ARMS)
    inj = merge(base, P(Chest=(10, 10, 0), Head=(25, 15, 0),
                        L_UpperArm=(-55, 10, 10), L_ForeArm=(-100, 30, 0), L_Hand=(0, 0, 0)))
    return keyed([(0, base), (0.35, inj), (0.9, inj), (1.3, base)], 1.3)

# ---------------- rifle clips (companion) -----------------
AIM_ARMS = P(R_UpperArm=(-28, 0, -42), R_ForeArm=(-105, 0, 0), R_Hand=(0, 0, 0),
             L_UpperArm=(-72, -28, 4), L_ForeArm=(-32, 0, 0), L_Hand=(0, 0, 0),
             Chest=(4, -8, 0), Neck=(0, 4, 0), Head=(6, 6, 0))
LOW_ARMS = P(R_UpperArm=(-18, 0, -30), R_ForeArm=(-95, 0, 0), R_Hand=(0, 0, 0),
             L_UpperArm=(-45, -30, 6), L_ForeArm=(-55, 0, 0), L_Hand=(0, 0, 0), Chest=(2, -4, 0))

def shoot():
    base = merge(legs_stance(), AIM_ARMS)
    kick = merge(base, P(Chest=(-5, -8, 0), R_UpperArm=(-22, 0, -42), L_UpperArm=(-66, -28, 4), Head=(2, 6, 0), hz=-0.02))
    # 3-round burst: three recoil kicks
    return keyed([(0, base), (0.04, kick, 'out'), (0.12, base), (0.16, kick, 'out'), (0.24, base), (0.28, kick, 'out'), (0.42, base), (0.6, base)], 0.6, True)

def aim():
    return idle(AIM_ARMS, 0.5)

def rifle_melee():
    base = merge(legs_stance(), RIFLE_ARMS)
    wind = merge(base, P(Chest=(-5, 35, 0), R_UpperArm=(-30, 30, -30), L_UpperArm=(-60, 50, 20)))
    hitp = merge(base, P(Chest=(20, -30, 0), Spine=(10, -10, 0), R_UpperArm=(-70, -20, -10),
                         L_UpperArm=(-100, -10, 15), L_ForeArm=(-10, 0, 0), hz=0.1, hy=-0.05))
    return keyed([(0, base), (0.2, wind), (0.32, hitp, 'in'), (0.7, base)], 0.7)


def sword_set():
    return {
        'Idle': idle(SWORD_ARMS),
        'Walk': locomotion(SWORD_ARMS, 1.05, 24, 40, 5, 0.025, 18, 'L'),
        'Run': locomotion(merge(SWORD_ARMS, P(R_UpperArm=(-30, -8, -14), R_ForeArm=(-70, 0, 0))),
                          0.66, 40, 75, 14, 0.05, 35, 'L'),
        'Attack1': attack1(), 'Attack2': attack2(), 'Heavy': heavy(),
        'Roll': roll(), 'Block': block(), 'Hit': hit(), 'Death': death(), 'Heal': heal(),
    }

def rifle_set():
    return {
        'Idle': idle(LOW_ARMS),
        'Walk': locomotion(LOW_ARMS, 1.05, 24, 40, 5, 0.025, 0, ''),
        'Run': locomotion(LOW_ARMS, 0.66, 40, 75, 14, 0.05, 0, ''),
        'WalkAim': locomotion(AIM_ARMS, 1.15, 18, 30, 3, 0.015, 0, ''),
        'Aim': aim(), 'Shoot': shoot(), 'Attack1': rifle_melee(),
        'Roll': roll(), 'Hit': hit(), 'Death': death(),
    }
