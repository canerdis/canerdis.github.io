# Siteyi panelden düzenleme

Sitenin içeriği (hakkında yazısı, bilgi şeridi, chartlar, data science
projeleri) Pages CMS paneliyle düzenlenir. Kod bilmek gerekmez.

## Bir kerelik kurulum

1. <https://app.pagescms.org> adresine gir, **Sign in with GitHub** de.
2. Pages CMS'in GitHub uygulamasını kur ve `canerdis.github.io` reposuna erişim ver.
3. Listeden repoyu seç, branch olarak `main`'i seç.

Soldaki menüde üç bölüm görünür: **Hakkında ve bilgiler**, **Chartlar**,
**Data science projeleri**.

## Kaydedince ne olur

Her kayıt GitHub'a bir commit olarak gider. Site 1–2 dakika içinde kendini
yeniden kurar ve yeni hali yayına girer. İlerlemeyi reponun **Actions**
sekmesinden izleyebilirsin.

Yayından önce testler ve tasarım kontrolleri otomatik çalışır. Bir şey
kuralı bozarsa site **bozulmaz**: önceki hali yayında kalır, GitHub sana
hata e-postası atar. Hatayı düzeltip tekrar kaydetmen yeterli.

## Hakkında yazısını değiştirmek

**Hakkında ve bilgiler** → **Hakkında** alanı. İsminin altındaki paragraf
budur; Google'da ve paylaşılan linklerde de bu görünür. En fazla 300 karakter.

Aynı sayfada:
- **Araçlar**: paragrafın altındaki satır.
- **Bilgi şeridi**: Focus, Based, Now gibi kutular. Kutu ekleyip silebilirsin.
  "Şu an" işaretli kutunun yanında küçük mavi nokta yanar; bir tane olması yeterli.
- **E-posta, LinkedIn, GitHub**: üst bardaki ve alttaki linkler.

## Yeni chart eklemek

**Chartlar** → sağ üstteki ekleme butonu.

- **Başlık**: grafiğin üstünde yazan kendi başlığı. Caption ya da post metni
  değil; ikisi çelişirse grafikteki kazanır.
- **Tarih**: yayımlandığı gün. Liste en yeniden eskiye sıralanır.
- **Özet**: bir iki cümle. Listede ve paylaşım önizlemesinde görünür.
- **Görsel**: sürükle bırak. Instagram'dan indirdiğin 2160 piksellik dosyayı
  olduğu gibi yükleyebilirsin; site sayfada gösterilen boyutları kendisi küçültür.
- **Görselin açıklaması**: görmeyen biri için grafik ne gösteriyor. Zorunlu.
- **Kaynak**: örn. `Eurostat · Europe Magazine`.
- **Araçlar**: her araç ayrı satır (Python, Flourish…).
- **Instagram linki**: yayımlandığı paylaşım. Boş bırakılabilir.
- **Başka yerde yayımlandı (çerçeveli göster)**: varsayılan olarak açık.
  Europe Magazine ya da LinkedIn'de kendi başlığı ve logosuyla yayımlanmış
  görseller için açık bırak; görsel ince bir çerçeveyle kupür gibi görünür,
  diğer Europe Magazine chartlarıyla aynı. Bu site için `charts/` stiliyle
  çizilmiş bir grafikse kapat.
- **Yazı sayfası olsun**: açıksa chart'ın kendi sayfası olur ve aşağıdaki yazı
  orada görünür. Kapalıysa kutu doğrudan görsele gider.
- **Ek sayfalar**: paylaşım carousel ise 2. ve sonraki sayfalar, her biri kendi
  açıklamasıyla.
- **Yazı**: Markdown (aşağıya bak).

Dosya adı başlıktan otomatik üretilir ve sayfanın adresi olur:
`canerdis.github.io/visualizations/<dosya-adı>`. İstersen kaydetmeden önce
kısaltabilirsin.

## Data science projesi eklemek

**Data science projeleri** → sağ üstteki ekleme butonu. Alanlar chartlarla aynı
mantıkta. Kapak görseli koyarsan açıklaması da zorunlu. **GitHub reposu**
`https://github.com/` ile başlamalı.

## Yazı (Markdown) nasıl yazılır

- `## Başlık` → sayfada yeni bir satır açar; başlık sol sütunda durur.
- `**kalın**`, `*italik*`, `[link metni](https://...)`.
- Liste için satır başına `- `.
- Tablo:

  ```
  | Model | Accuracy |
  |---|---|
  | Random Forest | 82.30% |
  ```

İlk `##`'den önceki paragraflar "Overview" satırında görünür.

## Silmek

Bir girişi listeden silersen sayfası da siteden kalkar. Görseller panelin
medya bölümünde kalır; gerekirse oradan ayrıca silebilirsin.

## Panelin yapamadıkları

Yerleşim, renk, yeni bölüm gibi tasarım değişiklikleri kod ister. Panel
sadece içeriği değiştirir.
