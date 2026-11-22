import base64,sys,shutil
src='./work/out'
with open('./assets/models.js','w') as f:
    f.write('/* Rigged character models (GLB, base64) - generated */\nwindow.ORION_MODELS={\n')
    for k,n in (('orion','OrionMascar'),('thomas','ThomasHawthorne'),('orionEye','OrionEyepatch'),('talina','TalinaAlvarez')):
        b=open(f'{src}/{n}_rigged.glb','rb').read()
        f.write(f'"{k}":"'+base64.b64encode(b).decode()+'",\n')
        shutil.copy(f'{src}/{n}_rigged.glb',f'./models/{n}_rigged.glb')
    f.write('};\n')
