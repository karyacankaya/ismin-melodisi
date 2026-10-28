// İsmin Melodisi — tarot kartları (yalnızca Büyük Arkana, 22 kart)
// Saf fonksiyonlar ve veriler: DOM'a dokunmaz, Node testlerinde doğrudan çalışır.
//
// Hesaplamalar:
//  - Kişilik (doğum) kartı: gün + ay + yıl toplanır; 22'den büyükse rakamları toplanır.
//  - Ruh kartı: kişilik sayısının rakamları tek haneye inene kadar toplanır.
//  - Yıl kartı: gün + ay + içinde bulunulan yıl, aynı indirgemeyle.
//  - İlişki kartı: iki kişinin kişilik sayısı toplanır, aynı indirgemeyle.
// 22 sayısı Deli (0) kartına karşılık gelir.

import { parseDate } from './numerology.js';

function digitSum(n) {
  let sum = 0;
  for (const d of String(n)) sum += Number(d);
  return sum;
}

/** 1–22 arasına indirger (22'den büyükse rakamlarını toplar). */
export function reduceTo22(n) {
  let x = Math.abs(Math.trunc(n));
  while (x > 22) x = digitSum(x);
  return x;
}

/** Tarot sayısı (1–22) → kart numarası (0–21). */
export function cardIndex(n) {
  return n === 22 ? 0 : n;
}

function dateOrThrow(dateStr) {
  const d = parseDate(dateStr);
  if (!d) throw new Error('Geçersiz tarih: ' + dateStr);
  return d;
}

/** Kişilik sayısı (1–22); kart için cardIndex() kullanılır. */
export function personalityNumber(dateStr) {
  const d = dateOrThrow(dateStr);
  return reduceTo22(d.day + d.month + d.year);
}

/** Ruh sayısı (1–9): kişilik sayısı tek haneye inene kadar. */
export function soulNumber(personality) {
  let x = personality;
  while (x > 9) x = digitSum(x);
  return x;
}

export function yearNumber(dateStr, year) {
  const d = dateOrThrow(dateStr);
  return reduceTo22(d.day + d.month + year);
}

export function relationshipNumber(personalityA, personalityB) {
  return reduceTo22(personalityA + personalityB);
}

/** Doğum tarihinden üç kişisel kart. */
export function tarotProfile(dateStr, year = new Date().getFullYear()) {
  const personality = personalityNumber(dateStr);
  const soul = soulNumber(personality);
  const yearN = yearNumber(dateStr, year);
  return {
    personality: CARDS[cardIndex(personality)],
    soul: CARDS[cardIndex(soul)],
    year: CARDS[cardIndex(yearN)],
    yearValue: year,
    sameSoul: cardIndex(personality) === cardIndex(soul),
    numbers: { personality, soul, year: yearN },
  };
}

/** İki doğum tarihinden ilişki kartı. */
export function relationshipCard(dateA, dateB) {
  const n = relationshipNumber(personalityNumber(dateA), personalityNumber(dateB));
  return { number: n, card: CARDS[cardIndex(n)] };
}

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

// Kart adları ve anahtar kelimeler kullanıcının verdiği Türkçe listeden;
// anlam ve ilişki metinleri bu proje için yazıldı.
// colors: [ana renk, vurgu rengi] — kartın ve anlam bölümünün renk dünyası.
const DATA = [
  ['Deli', 'The Fool', 'Yeni başlangıçlar, risk alma, özgürlük', ['#4f8fc4', '#f2c75c'],
    'Bilinmeyene gülümseyerek adım atan yolcu. Hesabı kitabı bir kenara bırakıp merakının peşine düşmeye çağırıyor; her büyük hikâye küçük, biraz da çılgın bir adımla başlar.',
    'Birlikte bir macera: ilişkiniz plansız ama canlı. Birbirinizi özgür bırakabildiğiniz ölçüde büyüyor.'],
  ['Büyücü', 'The Magician', 'İrade gücü, yaratım, beceri, potansiyel', ['#4b2a6e', '#d9a440'],
    'Elindeki her şeyi bir araya getirip yoktan var edebilen. Niyetini netleştirdiğinde düşünceler hızla gerçeğe dönüşür; sihir, odaklanmış iradende saklı.',
    'Konuşarak çözen, birlikte üreten bir ilişki. Aranızdaki iletişim güçlü; ortak bir projeye dönüştüğünüzde ikiniz de parlıyorsunuz.'],
  ['Azize', 'The High Priestess', 'Sezgiler, gizem, bilinçaltı, sabır', ['#1b2547', '#d7dbe6'],
    'Sessizliğin ardındaki bilgiyi duyan. Cevaplar dışarıda değil, içinde; acele etmeden dinlediğinde sezgilerin yolu gösterir.',
    'Derin ve sezgisel bir bağ; çoğu şey söze dökülmeden anlaşılıyor. Sırlara değil sessiz bir güvene alan açtığınızda bağınız derinleşir.'],
  ['İmparatoriçe', 'The Empress', 'Bereket, doğa, annelik, sevgi, yaratıcılık', ['#2f6b4a', '#e8a0b0'],
    'Dokunduğu her şeyi büyüten, besleyen. Güzellik, bolluk ve yaratıcılık senin doğanda; kendine de bir bahçe gibi özen göster.',
    'Şefkatli, üretken ve sıcak bir yuva enerjisi. Birlikte bir şey büyütmek — bir ev, bir hayal, bir bahçe — bu ilişkiye çok yakışır.'],
  ['İmparator', 'The Emperor', 'Otorite, düzen, güç, koruma, mantık', ['#8f1d1f', '#8a8f98'],
    'Sağlam temeller kuran, sınırlarını bilen. Disiplinin ve sorumluluk duygun etrafına güven veriyor; gücünü korumak için kullandığında gerçek bir lider oluyorsun.',
    'Güvenli, düzenli ve sadık bir ilişki. Kurallar kadar yumuşaklığa da yer açtığınızda kale bir yuvaya dönüşür.'],
  ['Aziz', 'The Hierophant', 'Gelenekler, inanç, rehberlik, toplumsal kurallar', ['#5e1a2a', '#efe2c4'],
    'Bilgeliği nesilden nesle taşıyan öğretmen. Değerlerine ve köklerine bağlılığın sana yön veriyor; öğrendiğini paylaşmak da senin yolun.',
    'Ortak değerler üzerine kurulu, ciddi ve kalıcı bir bağ. Geleneklere saygı kadar birbirinizin farklılıklarına da alan açmak önemli.'],
  ['Aşıklar', 'The Lovers', 'Seçimler, uyum, ilişkiler, aşk', ['#c9607e', '#e8b54a'],
    'Kalbiyle aklı arasında doğru seçimi arayan. Değerlerinle uyumlu karar verdiğinde hayatın ahenk bulur; sevgi senin pusulan.',
    'Güçlü bir çekim ve ruh ikizi hissi. Sevginiz sık sık bir seçim yapmanızı isteyebilir; birbirinizi her seferinde yeniden seçtiğinizde bağ sağlamlaşır.'],
  ['Savaş Arabası', 'The Chariot', 'Azim, zafer, kontrol sağlama, kararlılık', ['#26336b', '#c9ccd6'],
    'Zıt güçleri dizginleyip hedefe süren. İrade ve odakla engelleri aşıyorsun; yönünü bildiğinde hiçbir yol uzun değil.',
    'Hedef odaklı, birlikte yol alan bir ikili. Aynı yöne baktığınızda durdurulamazsınız; dizginleri paylaşmak işin sırrı.'],
  ['Güç', 'Strength', 'İçsel güç, sabır, şefkat, cesaret', ['#b8661f', '#f0c35a'],
    'Aslanı zorla değil sevgiyle evcilleştiren. Gerçek güç yumuşaklıkta saklı; sabrın ve cesaretin en zor anlarda bile seni ayakta tutuyor.',
    'Şefkatle büyüyen, birbirinin zor yanlarını kucaklayan bir bağ. Sabır ve nezaket, aranızdaki tutkuyu en güzel hâline taşıyor.'],
  ['Ermiş', 'The Hermit', 'İçgörü, yalnızlık, bilgelik, arayış', ['#3b2240', '#f2c75c'],
    'Elinde feneriyle kendi yolunu aydınlatan. Yalnız kaldığın anlar seni besliyor; içe dönüp bulduğun ışık başkalarına da yol gösteriyor.',
    'Derin, sakin ve olgun bir bağ. Birbirinize yalnız kalacak alan tanıdığınızda birlikteliğiniz daha da anlam kazanıyor.'],
  ['Kader Çarkı', 'Wheel of Fortune', 'Şans, kadersel değişimler, döngüler', ['#2f8f8a', '#d9a440'],
    'Hayatın dönen çarkıyla dans eden. İnişler ve çıkışlar bir döngünün parçası; akışa güvendiğinde şans kapını çalıyor.',
    'Kaderin bir araya getirdiği bir bağ; "yollarımız zaten kesişecekti" hissi. İnişli çıkışlı olabilir, ama çark sizi hep yeniden buluşturuyor.'],
  ['Adalet', 'Justice', 'Hak, denge, sebep-sonuç ilişkisi', ['#7a1f24', '#d9a440'],
    'Teraziyi dürüstlükle tutan. Yaptığın her şeyin bir karşılığı olduğunu biliyorsun; açık ve adil kalmak sana huzur veriyor.',
    'Eşitlik ve dürüstlük üzerine kurulu bir ilişki. Verip almanın dengesi korunduğunda güven sarsılmaz.'],
  ['Asılan Adam', 'The Hanged Man', 'Farklı bakış açısı, fedakârlık, duraklama', ['#1f4e6e', '#e8b54a'],
    'Dünyaya tersinden bakıp yeni bir anlam bulan. Bazen beklemek, bırakmak ve bakış açını değiştirmek en büyük ilerlemedir.',
    'Aceleye gelmeyen bir bağ. Sabretmek ve birbirinizin gözünden bakmayı öğrenmek, ilişkinizi beklenmedik bir derinliğe taşıyor.'],
  ['Ölüm', 'Death', 'Dönüşüm, bir dönemin bitişi, yeniden doğuş', ['#1c1816', '#efe2c4'],
    'Eskiyi geride bırakıp yeniden doğan. Bir kapının kapanması bir başkasının açılmasıdır; değişimden korkmadığında hayat seni tazeler.',
    'Birbirinizi derinden dönüştüren bir bağ. Bu ilişkiden ikiniz de eskisi gibi çıkmazsınız; ama daha bütün, daha özgür çıkarsınız.'],
  ['Denge', 'Temperance', 'Uyum, sabır, ölçülülük, şifa', ['#8f84c4', '#8fc3d6'],
    'Zıtları sabırla harmanlayan bir simyacı. Ölçülülüğün ve sakinliğin hem sana hem çevrene şifa oluyor.',
    'Huzurlu ve dengeli bir bağ; birbirinizi yumuşatıyor ve tamamlıyorsunuz. Küçük uzlaşmalar büyük bir uyum yaratıyor.'],
  ['Şeytan', 'The Devil', 'Bağımlılıklar, maddi arzular, zincirler, illüzyon', ['#1a1414', '#c2361f'],
    'Arzularını ve gölge yanlarını tanıyan. Seni bağlayan zincirleri fark ettiğinde, onları çıkarmanın anahtarı zaten elinde.',
    'Yoğun bir çekim ve tutku. Bu güçlü bağ güzel olduğu kadar özen de istiyor; birbirinizi sahiplenmek yerine özgür bıraktığınızda tutku sağlıklı kalır.'],
  ['Yıkılan Kule', 'The Tower', 'Ani değişim, sarsıcı uyanış, egonun yıkılması', ['#454a56', '#e86a2a'],
    'Sahte duvarları yıkıp gerçeği gören. Sarsıcı anlar aslında seni sağlam olmayan yapılardan kurtarıyor; yıkıntının yerine daha sağlamı yükselir.',
    'Alışkanlıkların ve egoların sarsıldığı, sıradan olmayan bir bağ. Birbirinizin duvarlarını yıkıyorsunuz; dürüstlükle yeniden kurduğunuzda çok daha sağlam olur.'],
  ['Yıldız', 'The Star', 'Umut, ilham, şifa, geleceğe inanç', ['#1d2b5c', '#e8b54a'],
    'Karanlık bir geceden sonra gökte beliren ışık. İçindeki umut hiç sönmüyor; ilham verdiğin insanlar sandığından çok daha fazla.',
    'Umut veren, iyileştiren bir ilişki. Birbirinize ilham oluyor, birlikte geleceğe güvenle bakıyorsunuz.'],
  ['Ay', 'The Moon', 'İllüzyonlar, korkular, belirsizlik, rüyalar', ['#4f4185', '#c9d0dc'],
    'Gölgelerin ve rüyaların arasında yolunu sezgiyle bulan. Her şey net olmadığında bile iç sesin seni doğru yöne götürüyor.',
    'Rüya gibi, büyülü ama zaman zaman belirsiz bir bağ. Korkularınızı ve beklentilerinizi açıkça konuştuğunuzda Ay\'ın ışığı yolu aydınlatır.'],
  ['Güneş', 'The Sun', 'Başarı, neşe, netlik, canlılık, mutluluk', ['#4f8fc4', '#f0b429'],
    'Etrafına ışık ve sıcaklık saçan. Neşen ve içtenliğin kapıları açıyor; olduğun gibi parladığında hayat da sana gülümsüyor.',
    'Neşeli, içten ve aydınlık bir ilişki. Birlikteyken çocuk gibi gülüyor, birbirinizi en iyi hâlinizle görüyorsunuz.'],
  ['Mahkeme', 'Judgement', 'Uyanış, geçmişle yüzleşme, çağrı, karar', ['#d98f99', '#f4f0ea'],
    'İçindeki çağrıyı duyup ayağa kalkan. Geçmişle barışıp yeni bir sayfa açma zamanı; gerçek benliğine uyanıyorsun.',
    'Birbirinizi uyandıran, geçmişle barıştıran bir bağ. Birlikte yeni bir sayfa açmaya, büyük bir "evet"e hazırsınız.'],
  ['Dünya', 'The World', 'Tamamlanma, bütünlük, başarı, döngünün bitişi', ['#2f6b4a', '#7a4fa0'],
    'Döngüsünü tamamlayıp bütünlüğe ulaşan. Emeklerinin meyvesini topluyor, dünyayla uyum içinde dans ediyorsun.',
    'Tamamlanmışlık ve huzur hissi veren bir bağ. Birlikte bütünsünüz; uzun soluklu, mutlu bir yolculuğun kartı.'],
];

export const CARDS = DATA.map(([name, en, keywords, colors, meaning, love], i) => ({
  number: i,
  roman: ROMAN[i],
  name,
  en,
  keywords,
  colors,
  meaning,
  love,
}));

export const TAROT_DISCLAIMER = 'Tarot ve numeroloji eğlence ve kendini düşünme amaçlıdır; bilimsel bir yöntem değildir.';
