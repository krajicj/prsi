# Finální prompt pro Claude Code / Codex

Vytvoř jednoduchou webovou hru **Prší** pro malé dítě, konkrétně pro **3letou holčičku**, jako lokální aplikaci v **HTML, CSS a JavaScriptu** bez backendu.  
Cílem není jen technické demo, ale **hezká, přehledná a výuková hra**, na které se dítě naučí základní principy Prší a postupně i pokročilejší pravidla.  
Zároveň chci, aby při zapnutí všech pravidel šlo o **plnohodnotnou běžnou hru Prší**, kterou si může zahrát i dospělý.

**Prefer a polished, toy-like feel over strict realism.**

---

## Technické požadavky
- Použij pouze:
  - `index.html`
  - `style.css`
  - `script.js`
  - případně `assets/` pro obrázky
- Musí fungovat po otevření `index.html` v prohlížeči
- Bez backendu
- Bez frameworků
- Kód musí být čistý, přehledný a modulární
- Komentáře a názvy v kódu piš **anglicky**
- Texty v uživatelském rozhraní mají být **česky**
- Připrav i `README.md`

---

## Herní režim
- pouze **1 hráč vs 1 počítač**
- žádný multiplayer
- žádné bodování
- jen výhra / prohra
- používá se **32karetní balíček**
- pořadí karet je určeno čistě **náhodným zamícháním**
- po zamíchání už je pořadí pevně dané pro:
  - rozdání
  - dobírání
- hra nesmí dítěti tajně pomáhat lepšími kartami
- AI ani hra nesmí manipulovat s rozdělením karet

---

## Počáteční nastavení
- každý hráč dostane na začátku **4 karty**
- na stole je odhazovací balíček a dobírací balíček
- hra má tlačítko **Nová hra**

---

## Hlavní cíl hry
Dítě se má naučit hlavně:
- že kartu lze přiložit podle **barvy**
- nebo podle **hodnoty**
- a když nemá vhodnou kartu, musí **líznout**

---

# Režimy hry

## 1) Child mode
Toto je výchozí režim a nejdůležitější část celé hry.

### V child mode:
- jsou vypnuté všechny speciální efekty
- **svršek / filek nemění barvu**
- **eso nestaví**
- **sedma nebere dvě**
- **žádné přebíjení**
- hráč může položit kartu pouze pokud sedí:
  - **barva**, nebo
  - **hodnota**
- pokud nemá vhodnou kartu, může kliknout na **Líznout**
- po líznutí **tah vždy končí**
- pokud má vhodnou kartu, **může se i tak rozhodnout líznout**, stejně jako v reálné hře
- vše musí být silně vizuální, protože dítě **neumí číst**

### UX v child mode:
- všechny možné tahy musí být **zeleně zvýrazněné**
- to znamená:
  - hratelné karty v ruce
  - a také tlačítko **Líznout**
- zelené zvýraznění má dítěti napovědět, co všechno může udělat
- po kliknutí na neplatnou kartu se má zobrazit jen jednoduchá vizuální reakce, ne dlouhý text
- hra má být ovladatelná i bez schopnosti číst
- minimum textu, maximum vizuální nápovědy

---

## 2) Standard / full mode
Mimo child mode lze zapínat jednotlivé pokročilé mechaniky přes přepínače.

Pokud budou zapnuté všechny relevantní mechaniky, výsledkem má být **normální hratelná verze Prší pro dospělého**.

---

# Přepínače pravidel

Ve hře musí být přehledné nastavení s těmito přepínači:

### 1. Child mode
Když je zapnutý:
- vypne všechny speciální mechaniky
- vypne změnu barvy u svrška / filka
- nechá pouze základní pravidlo:
  - stejná barva
  - nebo stejná hodnota
  - jinak můžeš hrát nebo líznout podle standardního toku hry

### 2. Eso staví
Když je zapnuto:
- zahrané eso přeskočí tah dalšího hráče

### 3. Sedma bere dvě
Když je zapnuto:
- zahraná sedma nutí dalšího hráče vzít 2 karty

### 4. Přebíjení
Když je zapnuto:
- **sedmy se vrství**
- **esa se přebíjí**
- logika:
  - pokud přijde sedma a přebíjení je povoleno, další hráč může zahrát sedmu a navýšit efekt
  - pokud přijde eso a přebíjení je povoleno, další hráč může zahrát eso a poslat efekt zpět soupeři
- architektura má být připravená i na další budoucí speciální pravidla

### 5. Svršek / filek mění barvu
Když je tato mechanika aktivní mimo child mode:
- po zahrání svrška / filka si hráč zvolí novou barvu
- protože hra má být dětská a vizuální, výběr barvy má být řešen přes **4 velká barevná tlačítka**, ne textovým seznamem

---

# Herní pravidla

## Základní validace tahu
Kartu lze zahrát, pokud:
- má stejnou barvu jako karta na stole
- nebo má stejnou hodnotu jako karta na stole
- nebo jde o speciální validní reakci podle aktivních pravidel

## Líznutí
- hráč **může líznout i tehdy, když má validní tah**, stejně jako v reálné hře
- po líznutí **tah vždy končí**
- totéž platí i pro AI
- v child mode má být tlačítko **Líznout** také jasně vizuálně dostupné a pochopitelné

## Přebíjení es
- když je aktivní pravidlo **Eso staví**, eso přeskočí tah dalšího hráče
- když je současně aktivní i **Přebíjení**, další hráč může zahrát eso a efekt vrátit zpět soupeři
- tedy klasické přehazování efektu mezi hráči

## Přebíjení sedem
- když je aktivní pravidlo **Sedma bere dvě**, sedma přidá povinnost vzít 2 karty
- když je současně aktivní i **Přebíjení**, další hráč může zahrát další sedmu a navýšit celkový počet braných karet

## Konec hry
- jakmile některý hráč zahraje poslední kartu, vyhrává
- zobraz jednoduchou vítěznou / prohrovou obrazovku
- bez bodového systému

---

# AI soupeř
AI má být jednoduchá, klidná a předvídatelná.

### Požadavky na AI:
- neoptimalizuj ji moc
- nemá podvádět
- hraje jen s informacemi, které opravdu má
- pokud má více validních tahů, může vybírat jednoduchým pravidlem nebo náhodně
- pokud se rozhodne líznout, tah končí
- AI může mít lehké zpoždění tahu, aby hra působila přirozeně

---

# Vizuální styl
Hra musí být velmi přehledná a vhodná pro malé dítě.

### Design zásady:
- velké karty
- velká tlačítka
- minimum textu
- silné barevné rozlišení
- jednoduché ilustrace
- žádný kasinový vzhled
- spíš milý, čistý, dětský styl

### Karty
Karty musí být:
- snadno rozpoznatelné
- dobře barevně odlišené
- jednoduché, ideálně stylizované
- podle režimu hry:
  - v child mode mohou být více zjednodušené / vizuální
  - mimo child mode mohou být o něco bližší klasickým kartám

### Důležité UX prvky
- validní karty zeleně zvýraznit
- nevalidní karty vizuálně utlumit
- tlačítko **Líznout** má být vždy dobře viditelné
- v child mode má být **Líznout** také zeleně zvýrazněné jako možná akce
- při zahrání speciální karty zobrazit jasnou animaci nebo ikonickou informaci
- nepoužívat dlouhé textové instrukce

---

# Přístupnost
- ovládání myší
- ideálně použitelné i na dotyk
- velké klikací plochy
- žádné malé ikonky vyžadující přesnost
- bez nutnosti číst text pro základní hraní v child mode

---

# Struktura kódu
Odděl logiku do přehledných částí, například:
- card model
- deck / shuffle logic
- state management
- rule validation
- turn handling
- AI turn
- UI rendering
- settings management

Kód musí být snadno rozšiřitelný.

---

# Důležité implementační poznámky
1. Použij čistě náhodné zamíchání balíčku.
2. Po zamíchání už nijak nemanipuluj s pořadím karet.
3. Child mode je nejdůležitější režim a UX mu musí být podřízené.
4. Dítě neumí číst, proto musí být hra hlavně vizuální.
5. Tlačítka a interakce musí být jednoduché a velké.
6. Při volbě nové barvy po svršku použij 4 velké barevné volby.
7. Po líznutí tah vždy končí.
8. Když budou zapnuté všechny funkce, hra má fungovat jako běžné hratelné Prší pro dospělého.
9. Nepřidávej žádné zbytečné komplikace, statistiky, skóre ani těžké menu.

---

# Co chci na výstupu
1. Kompletní funkční implementaci
2. Přehlednou strukturu souborů
3. Jednoduché assety nebo fallback render karet, pokud assety nejsou
4. README s popisem:
   - jak hru spustit
   - jak fungují režimy
   - jak fungují přepínače
   - jak fungují speciální pravidla
   - co by šlo snadno rozšířit

---

# Priorita
Nejvyšší priorita je:
1. jednoduchost pro dítě
2. vizuální srozumitelnost
3. stabilní logika pravidel
4. čistý kód
5. možnost budoucího rozšíření
