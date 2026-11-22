import base64,shutil
src='/home/claude/work/out'
# two bundles, so neither file gets too large: the original cast, and the Chapter V leaders
BUNDLES={'models.js':(('orion','OrionMascar'),('thomas','ThomasHawthorne'),('orionEye','OrionEyepatch'),('talina','TalinaAlvarez'),('ines','InesAlvarez'),('talinaP','TalinaPregnant')),
         'models_ch5.js':(('orlov','VladimirOrlov'),('yi','YiLiang'),('josiah','JosiahWilliams'))}
for fn,items in BUNDLES.items():
    with open(f'/home/claude/game/assets/{fn}','w') as f:
        f.write('/* Rigged character models (GLB, base64) - generated */\nwindow.ORION_MODELS=window.ORION_MODELS||{};\nObject.assign(window.ORION_MODELS,{\n')
        for k,n in items:
            b=open(f'{src}/{n}_rigged.glb','rb').read()
            f.write(f'"{k}":"'+base64.b64encode(b).decode()+'",\n')
            shutil.copy(f'{src}/{n}_rigged.glb',f'/home/claude/game/models/{n}_rigged.glb')
        f.write('});\n')
