import base64,sys,shutil
src='/home/claude/work/out'
with open('/home/claude/game/assets/models.js','w') as f:
    f.write('/* Rigged character models (GLB, base64) - generated */\nwindow.ORION_MODELS={\n')
    for k,n in (('orion','OrionMascar'),('thomas','ThomasHawthorne'),('orionEye','OrionEyepatch'),('talina','TalinaAlvarez'),('ines','InesAlvarez'),('talinaP','TalinaPregnant')):
        b=open(f'{src}/{n}_rigged.glb','rb').read()
        f.write(f'"{k}":"'+base64.b64encode(b).decode()+'",\n')
        shutil.copy(f'{src}/{n}_rigged.glb',f'/home/claude/game/models/{n}_rigged.glb')
    f.write('};\n')
