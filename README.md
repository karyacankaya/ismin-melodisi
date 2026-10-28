# İsmin Melodisi

Adını ve doğum tarihini yaz:

- **harflerin** bir Türk müziği makamında çalan 25–45 saniyelik küçük bir besteye,
- **notaların** bir İran halısına,
- **doğum tarihin** tarot kartlarına dönüşsün.

Aynı ad ve tarih her zaman aynı melodiyi, aynı halıyı ve aynı kartları verir.

> Eğlence amaçlıdır, bilimsel bir yöntem değildir.

## Neler var?

- **Numeroloji (Pisagor sistemi):** yaşam yolu, kader (ifade), ruh güdüsü ve kişilik sayıları. Türkçe harfler taban harfe eşlenir (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u). 11, 22 ve 33 usta sayıları indirgenmez.
- **Melodi:**
  - **Makam:** yaşam yolu sayısı dokuz makamdan birini seçer: Rast, Uşşak, Majör Pentatonik, Çargâh, Hicaz, Nihâvend, Kürdî, Hüseynî, Sabâ. Koma sesleri yaklaşık olarak çalınır.
  - **Usul:** ifade sayısı usulü seçer (Sofyan, Düyek, Semâî, Aksak) ve tempoyu belirler.
  - **Harfler:** her harf bir nota. Sesli harfler uzun, sessizler kısa, boşluk es.
  - **Bölümler:** giriş, tema, cevap, ney'li nakarat ve yavaşlayan final.
  - **Çalgılar:** kanun, ney, ud bası, def ve dem. Hepsi dosyasız, Web Audio API ile sentezlenir.
- **Halı:** İran halısı düzeninde ortada göbek, köşelerde köşebentler, üç katlı bordür; zeminde her harf bir motif sırası (buta, herati, servi…). Melodi çalarken o harfin sırası parlar. 12 halı paleti var.
- **Tarot:** kişilik, ruh, yıl ve ilişki kartları; 22 Büyük Arkana kartı. İki deste arasında seçim yapılabilir:
  - **Çizim deste:** bu site için kodla çizildi.
  - **Orijinal deste:** Pamela Colman Smith'in 1909 tarihli Rider–Waite–Smith çizimleri (kamu malı).
- **Uyum modu:** iki ad ve iki tarih girilir. İki melodi önce sırayla, sonra birlikte çalar. İki halı tek halıda birleşir. Uyum yorumu ve ilişki kartı çıkar.
- **Paylaşım:**
  - **Link:** `?ad=…` ile açılınca sonuç hazır gelir. Doğum tarihi linke yalnızca kullanıcı isterse eklenir; aksi hâlde link yalnızca sayıları taşır.
  - **Kart:** 4:5 oranında, ekran görüntüsüne uygun bir sonuç kartı; PNG olarak indirilebilir.

## Nasıl çalıştırılır?

Tarayıcılar ES modüllerini doğrudan dosyadan (`file://`) açmaz; küçük bir yerel sunucu gerekir. Proje klasöründe:

```bash
python3 -m http.server 8000
```

Sonra tarayıcıda **http://localhost:8000** adresini aç.

Ses ancak **"Çal"** düğmesine basınca başlar; tarayıcılar sesin kendiliğinden başlamasına izin vermez.

## Testler

Bağımlılık yok, yalnızca Node.js 18 veya üstü gerekir:

```bash
node --test
```

Testler şunları kontrol eder:
- Türkçe harfler, usta sayılar ve gönderilen örnekler (ör. 21.10.1987 → 11, Karya → kader 2 / ruh 2 / kişilik 9).
- Tarot hesapları (ör. 15.11.1992 → XI Adalet / II Azize, 2026 yılı → IX Ermiş, 3 + 9 → XII Asılan Adam).
- Bestenin yapısı ve halının simetrisi.
- Aynı girdinin her zaman aynı sonucu vermesi.

## GitHub Pages'te yayınlama

1. GitHub'da yeni bir depo aç (ör. `ismin-melodisi`) ve bu klasörü oraya gönder:
   ```bash
   git init
   git add .
   git commit -m "İsmin Melodisi"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/ismin-melodisi.git
   git push -u origin main
   ```
2. Depoda **Settings → Pages** bölümüne git.
3. **Source** olarak "Deploy from a branch", dal olarak **main** ve klasör olarak **/ (root)** seç, kaydet.
4. Birkaç dakika sonra site `https://KULLANICI_ADIN.github.io/ismin-melodisi/` adresinde yayında olur.

Build aracı gerekmez; dosyalar olduğu gibi yayınlanır.

## Dosya yapısı

```
index.html          sayfa iskeleti
style.css           tasarım (mobil önce)
js/numerology.js    sayılar, temalar, uyum yorumu, deterministik rastgelelik
js/melody.js        makamlar, usuller, harflerden beste
js/kilim.js         İran halısı: düzen, motifler, dokulu çizim, parlama
js/audio.js         ses motoru: kanun, ney, ud, def, dem, yankı
js/tarot.js         tarot hesapları ve 22 kartın metinleri
js/cardart.js       kart çerçevesi ve çizim destenin sahneleri (SVG)
js/app.js           sayfayı bağlayan kod: formlar, çalma, paylaşım, PNG, uyum, rehber
assets/tarot/       orijinal destenin 22 resmi (600 px)
test/               node:test birim testleri
```

## Kaynaklar

- **Orijinal tarot destesi:** Pamela Colman Smith, *Rider–Waite–Smith* (1909). Kamu malı; resimler Wikimedia Commons'tan alındı ("RWS Tarot 00 Fool.jpg" … "RWS Tarot 21 World.jpg").
- **Yazı tipleri:** Cormorant Garamond, EB Garamond, Caveat ve Cinzel (Google Fonts).
- **Çizim deste, halılar ve müzik:** bu proje için kodla üretildi.
