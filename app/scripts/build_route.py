"""Builds src/content/route.json from the researched texts in replica/content.
Run: python3 scripts/build_route.py   (from the app folder)"""
import json, os, re, glob
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '..', '..', 'replica', 'content'))
OUT = os.path.join(HERE, '..', 'src', 'content', 'route.json')

META = [  # verified coordinates and short notes from the research files
 dict(id='assembly', title='Национальное собрание', sub='Парламент Йорна Утзона · снаружи', lat=29.36975, lng=47.96240, r=100,
      walk='Старт маршрута. Такси можно попросить высадить у перекрёстка со светофором.',
      practical=['Внутрь не пускают, смотрим снаружи.', 'Охрану и посты не снимайте, дроны запрещены.'],
      image='https://commons.wikimedia.org/wiki/File:Kuwait_City_Arabian_Gulf_Street_10.jpg', credit='Zairon, CC BY 4.0'),
 dict(id='museum', title='Национальный музей', sub='История страны и сад', lat=29.37331, lng=47.96685, r=90,
      walk='≈600 м вдоль залива. Залив-стрит переходить не нужно, на съездах смотрите по сторонам.',
      practical=['Музей частично на реконструкции, перед визитом уточните, открыт ли он.', 'Примерно 8:30–12:30 и с 16:00, часы не подтверждены официально.'],
      image='https://commons.wikimedia.org/wiki/File:Kwnmuseum.jpg', credit='Kuwaitsoccer, CC BY-SA 3.0'),
 dict(id='sadu', title='Дом Саду', sub='Бедуинское ткачество', lat=29.37469, lng=47.96726, r=40,
      walk='Совсем рядом с музеем, пара минут пешком.',
      practical=['8:00–13:00 и 16:00–20:00 (официальный сайт).', 'В пятницу, скорее всего, закрыт.'],
      image='https://commons.wikimedia.org/wiki/File:Beitalsadu.jpg', credit='xiquinhosilva, CC BY-SA 2.0'),
 dict(id='seif', title='Дворец Сейф', sub='Часовая башня · только снаружи', lat=29.37965, lng=47.97355, r=35,
      walk='≈900 м, 12–15 минут вдоль Арабиан-Галф-стрит. Дорога быстрая, переходите только по переходам.',
      practical=['Фотографировать дворец запрещено законом.', 'Внутрь не пускают, это действующая резиденция.'],
      image='https://commons.wikimedia.org/wiki/File:Plaza_Sief,_ciudad_de_Kuwait,_Kuwait,_2024-08-12,_DD_45.jpg', credit='Diego Delso, CC BY-SA 4.0'),
 dict(id='mosque', title='Большая мечеть', sub='Крупнейшая мечеть Кувейта', lat=29.37918, lng=47.97425, r=45,
      walk='≈120 м от площади, один переход по разметке.',
      practical=['Экскурсии вс–чт: 9:00, 10:00, 11:00, 16:30–18:00, по записи.', 'Закрытая одежда, женщинам платок; абаю выдают на месте.', 'Во время намаза не заходите и не снимайте молящихся.'],
      image='https://commons.wikimedia.org/wiki/File:Kuwait_City_Grand_Mosque_Exterior_South_Facade_5.jpg', credit='Zairon, CC BY 4.0'),
 dict(id='souq', title='Рынок Мубаракия', sub='Старый сук: финики, специи, золото', lat=29.37727, lng=47.97400, r=40,
      walk='≈350 м, 5 минут на юг, два перехода.',
      practical=['В пятницу утром почти всё закрыто, оживает после 16:00.', 'В мелких лавках лучше наличные.', 'Часть рынка после пожара 2022 года ещё может быть за забором.'],
      image='https://commons.wikimedia.org/wiki/File:Kuwait_City_Souq_al-Mubarakeya_at_Night_01.jpg', credit='Zairon, CC BY 4.0'),
 dict(id='liberation', title='Башня Освобождения', sub='По желанию · вид снаружи', lat=29.36955, lng=47.97418, r=60, optional=True,
      walk='≈900 м, 12–15 минут от рынка.',
      practical=['Смотровая площадка закрыта для туристов, открывается лишь на несколько дней в году.'],
      image='https://commons.wikimedia.org/wiki/File:Liberationtower_kuwait.jpg', credit='Malaiya, CC BY-SA 3.0'),
]

def clean(t):
    t = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'\1', t)
    t = re.sub(r'(?<!\w)\*(.+?)\*(?!\w)', r'\1', t)
    return t.replace('`', '').strip()

def secs(text):
    parts = re.split(r'\n(?=## )', text)
    return [(p.split('\n', 1)[0][3:].strip(), p.split('\n', 1)[1] if '\n' in p else '') for p in parts[1:]]

def paras(body):
    out = []
    for block in re.split(r'\n\s*\n', body):
        b = block.strip()
        if not b or b == '---' or b.startswith('>') or b.startswith('#'): continue
        out.append(clean(' '.join(l.strip() for l in b.split('\n'))))
    return out

def script_of(sections, pat):
    for h, b in sections:
        if re.search(pat, h, re.I) and 'расскажи' not in h.lower(): return paras(b)
    raise SystemExit('no script ' + pat)

def more_of(sections):
    for h, b in sections:
        if 'расскажи' in h.lower():
            items = re.split(r'\n(?=### )', '\n' + b)
            res = []
            for it in items:
                it = it.strip()
                if not it.startswith('### '): continue
                head, _, body = it.partition('\n')
                title = re.sub(r'^###\s+(\d+(\.\d+)*\.|История \d+\.)\s*', '', head)
                title = re.sub(r'\s*\(≈?\d+ слов\)', '', title)
                res.append(dict(title=clean(title), text=paras(body)))
            return res
    return []

def faq_of(sections):
    for h, b in sections:
        if 'вопрос' in h.lower():
            res = []
            for m in re.finditer(r'(?:^|\n)\s*(?:\d+\.\s*)?\*\*(?:\d+\.\s*)?(.+?)\*\*\s*\n?(.+?)(?=\n\s*(?:\d+\.\s*)?\*\*|\n---|\Z)', b, re.S):
                res.append(dict(q=clean(m.group(1)), a=clean(' '.join(m.group(2).split()))))
            return res
    return []

files = sorted(glob.glob(os.path.join(SRC, 'stop-0*.md')))
assert len(files) == len(META)
stops = []
for i, (f, meta) in enumerate(zip(files, META), 1):
    s = secs(open(f, encoding='utf-8').read())
    stops.append(dict(order=i, id=meta['id'], title=meta['title'], subtitle=meta['sub'], lat=meta['lat'], lng=meta['lng'],
                      radius=meta['r'], optional=meta.get('optional', False), walk=meta['walk'], practical=meta['practical'],
                      imagePage=meta['image'], imageCredit=meta['credit'],
                      script=script_of(s, 'аудио'), more=more_of(s), faq=faq_of(s)))
brief = secs(open(os.path.join(SRC, 'route-brief.md'), encoding='utf-8').read())
fin = secs(open(os.path.join(SRC, 'finish.md'), encoding='utf-8').read())
def eat_of(sections):
    for h, b in sections:
        if 'поесть' in h.lower():
            res = []
            for it in re.split(r'\n(?=### )', '\n' + b):
                it = it.strip()
                if not it.startswith('### '): continue
                head, _, body = it.partition('\n')
                name = clean(re.sub(r'^###\s+\d+\.\s*', '', head))
                flat = clean(' '.join(body.split()))
                m = re.search(r'Чем извест\w*:\s*(.+?)(?:\s-\s|$)', flat)
                note = (m.group(1) if m else flat)
                if len(note) > 200: note = note[:200].rsplit('. ', 1)[0] + '.'
                unsure = not name.startswith('Freej')  # only Freej Swaileh was confirmed open in 2026
                res.append(dict(name=re.sub(r'\s*\([^)]*[\u0600-\u06FF][^)]*\)', '', name), note=note, unsure=unsure))
            return res
    return []

route = dict(
    id='old-kuwait', city='Кувейт-Сити', title='Старый Кувейт-Сити', subtitle='От залива до рынка',
    distanceKm=3.5, durationText='2–2,5 часа', bestTime='вс–чт, старт в 8:30',
    intro=script_of(brief, 'вступлен'), outro=script_of(fin, 'заключительн'),
    tips=['Ноябрь–март — лучший сезон, с мая по сентябрь днём опасно жарко.',
          'Возьмите воду, головной убор и закрытую одежду для мечети.',
          'В мечеть — только вс–чт и по записи, в пятницу и субботу внутрь не попасть.',
          'Дворец Сейф и другие правительственные здания фотографировать нельзя.'],
    safety='В регионе неспокойно: в ноябре 2026 года ПВО Кувейта сбивала беспилотники. Проверьте рекомендации МИД перед прогулкой. Если услышите сирену, зайдите в ближайшее здание.',
    eat=eat_of(fin),
    stops=stops)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(route, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for s in stops: print(s['order'], s['title'], len(' '.join(s['script']).split()), 'words', len(s['more']), 'more', len(s['faq']), 'faq')
print('intro', len(' '.join(route['intro']).split()), 'outro', len(' '.join(route['outro']).split()))
