# SAB Book: project notes

Naye chat mein sirf ye file padho, poora code nahi. Badlav ke baad ise update karo.

## Kya hai
Books/ebooks ki site "SAB Book". Next.js 14 (App Router, JavaScript, `@/*` = `src/*`) + Firebase Auth (Google) + Firestore + Vercel.
Repo: `sharma11ji/sab-tools-web` (main par push = Vercel auto deploy, ~1-2 min). Firebase project: `sab-tool` (free Spark plan, Storage NAHI chalta).
Admin email: `amrjeetgaming2@gmail.com` (`src/lib/admin.js` aur `firestore.rules` dono mein).
Site: sab-tools-chi.vercel.app. User Hinglish mein, phone se likhta hai.

## Files
- `src/app/page.js` home: category ki shelves (BookRow), neeche chevron se 2-2 aur categories, search se flat grid
- `src/app/book/[id]/page.js` book page: cover, stats, READ NOW, description, pills, rating, reviews, about author
- `src/app/admin/page.js` admin: Books tab (add/edit/delete, cover photo chuno, file upload) + Requests tab
- `src/app/request/page.js` "Request a Book" form, `src/app/profile/page.js` Google sign in
- `src/components/`: Header (logo + search), Sidebar, Shell, BookCard, BookRow, BookIcons
- `src/lib/books.js` helpers (groupByCategory, splitCategories, averageRating...), `firebase.js`, `AuthContext.js`, `admin.js`
- `src/app/globals.css` saari styling (kaala/safed, `.shelf*`, `.book-*`, `.review-*`)
- `firestore.rules` Firebase Console > Firestore > Rules mein haath se paste karna padta hai

## Firestore data
- `books/{id}`: title, author, cover (https link YA `data:image/jpeg;base64` chhoti photo), pages, categories[], readUrl (Drive/koi https link), readFile (bookFiles id), readFileName, description, authorBio, createdAt
- `books/{id}/reviews/{uid}`: uid, name, photoURL, rating 1-5, text (<=500), createdAt. Ek user ka ek review.
- `bookFiles/{fid}`: name, type, size, chunks, createdAt. `bookFiles/{fid}/chunks/{0000..}`: n, data (base64, 700000 akshar, 4 ka guna).
- `apiRequests/{id}`: name, details, uid, email, createdAt (user ki "Request a Book"). Purana `apis` collection ab use nahi hota.
- Rules: books, reviews, bookFiles padhna sabko; likhna admin ko (review sirf apna).

## READ NOW kaise chalta hai
`readFile` ho to chunks jodkar Blob banta hai (PDF/photo/text browser mein khulta hai, baaki download), warna `readUrl` naye tab mein khulta hai.
File upload limit 5 MB (Spark plan, Storage ke bina). Badi file ke liye Google Drive link ("Anyone with link").

## Faisle
- Pehle SAB Tools tha (QR, SIP, GST, IFSC, Chat). 12 Nov 2026 ko poora idea badla, sab hata diya (git history mein hai).
- Category ka naam shelf ke upar. Chautha stat reviews ki ginti.
- Chat, games, code editor nahi banaye.

## Baaki / dhyan
- Naye `firestore.rules` Firebase Console mein publish karne zaroori hain (books, reviews, bookFiles).
- Admin mein CSV/Sheet se books import: user ne abhi bataya nahi ki chahiye ya nahi.
- Purana Weather API doc Firestore `apis` mein pada hai (ab dikhta nahi).
- Tokens bachane ke liye: file poori padhne ki jagah Grep se sahi line dhoondho, edit ke baad dobara mat padho.
- Is session mein GateGuard hook har edit/Write se pehle "facts" maangta hai: pehle Grep chalao, phir facts likhkar retry karo.
