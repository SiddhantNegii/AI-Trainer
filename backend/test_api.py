import requests

headers = {'X-API-Key': '44368a396cmsh9a36561adcfe9b2p1bb937jsn01e7ee820a52'}
r = requests.get('https://exercisedb.dev/api/v1/exercises', headers=headers, params={'limit': 300}, timeout=15)
print('Status:', r.status_code)
print('Response text:', r.text[:200])
data = r.json()
exercises = data.get('data', [])

print('Total exercises:', len(exercises))

bp_set = set()
eq_set = set()

for ex in exercises:
    bp_set.update(ex.get('bodyParts', []))
    eq_set.update(ex.get('equipments', []))

print('\nBody Parts:', sorted(bp_set))
print('\nEquipments:', sorted(eq_set))
