class Shuffler{
	#variants = undefined
	#shuffleVariants = undefined
	#currentIndex = undefined
	#currentValue = undefined
	constructor(variants) {
		this.#variants = variants
		this.#shuffleVariants = Shuffler.#shuffle(...this.#variants)
		this.#currentIndex = 0
		this.#currentValue = this.#shuffleVariants[0]
	}
	get title()
	{
		return `${this.currentIndex + 1} из ${this.size}`
	}
	get config()
	{
		return {
			shuffleVariants: this.#shuffleVariants,
			currentIndex: this.#currentIndex,
			currentValue: this.#currentValue
		}
	}
	set config({shuffleVariants, currentIndex, currentValue})
	{
		this.#shuffleVariants = shuffleVariants
		this.#currentIndex = currentIndex
		this.#currentValue = currentValue
	}

	static #shuffle (...array)  {
		for (let i = array.length - 1; i > 0; i--) 
		{
			let j = Math.floor(Math.random() * (i + 1))
			let temp = array[i]
			array[i] = array[j]
			array[j] = temp
		}
		return array
	}
	refresh() {
		this.#shuffleVariants = Shuffler.#shuffle(...this.#variants)
		this.#currentIndex = 0
		this.#currentValue = this.#shuffleVariants[0]
	}
	get currentShuffle() {
		return this.#shuffleVariants
	}
	get currentIndex() {
		return this.#currentIndex
	}
	get currentValue() {
		return this.#currentValue
	}
	get size() {
		return this.#variants.length
	}
	update() {
		this.#shuffleVariants = this.#shuffleVariants.slice(1)

		if (this.#shuffleVariants.length == 0)
			return this.refresh()
		
		this.#currentIndex += 1
		this.#currentValue = this.#shuffleVariants[0]
	}
}

class CustomStorage {
	constructor(dbName, storeName) {
		this.onInitialized = () => { }
		this.dbName = dbName;
		this.storeName = storeName;
		this.db = null;
		this._openDatabase(); // Открытие базы данных сразу при создании объекта
	}

	// Открываем базу данных асинхронно
	async _openDatabase() {
		try {
			const request = indexedDB.open(this.dbName, 1);

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				// Создание объекта хранилища, если его еще нет
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
				}
			};

			request.onsuccess = (event) => {
				this.db = event.target.result;
				console.info('База данных открыта успешно');
				this.onInitialized()
			};

			request.onerror = (event) => {
				console.error("Ошибка открытия базы данных:", event);
			};
		} catch (e) {
			console.error("Ошибка при открытии базы данных:", e);
		}
	}

	// Сохраняем данные в IndexedDB
	async setItem(key, value) {
		if (!this.db) {
			console.error("База данных еще не инициализирована.");
			return;
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);

			const data = {
				id: key,
				value: value
			};

			const request = store.put(data);

			request.onsuccess = () => resolve();
			request.onerror = (e) => reject(e);
		});
	}

	// Извлекаем данные из IndexedDB
	async getItem(key) {
		if (!this.db) {
			console.error("База данных еще не инициализирована.");
			return null;
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], "readonly");
			const store = transaction.objectStore(this.storeName);

			const request = store.get(key);

			request.onsuccess = (e) => resolve(e.target.result ? e.target.result.value : null);
			request.onerror = (e) => reject(e);
		});
	}

	// Удаляем данные из IndexedDB
	async removeItem(key) {
		if (!this.db) {
			console.error("База данных еще не инициализирована.");
			return;
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);

			const request = store.delete(key);

			request.onsuccess = () => resolve();
			request.onerror = (e) => reject(e);
		});
	}

	// Очищаем все данные в хранилище
	async clear() {
		if (!this.db) {
			console.error("База данных еще не инициализирована.");
			return;
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);

			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = (e) => reject(e);
		});
	}

	// Получаем ключ по индексу
	async key(index) {
		if (!this.db) {
			console.error("База данных еще не инициализирована.");
			return null;
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], "readonly");
			const store = transaction.objectStore(this.storeName);

			const request = store.getAllKeys();

			request.onsuccess = (e) => {
				const keys = e.target.result;
				resolve(keys[index] || null);
			};
			request.onerror = (e) => reject(e);
		});
	}
}

const customStorage = new CustomStorage("CardDataBase", "CardStorage");

function setSection(section) {
	try {
		const oldSection = document.querySelector(".section.active");
		oldSection.classList.remove("active");
		oldSection.style.display = "none"
	} catch {
	}
	try {
		const oldSectionBtn = document.querySelector(".section-btn.active");
		oldSectionBtn.classList.remove("active");
	} catch {
	}

	try {
		const currentSection = document.querySelector(section)
		currentSection.classList.add("active");
		currentSection.style.display = "flex"
	} catch { }

	requestAnimationFrame(async ()=>{
		const currentSectionBtn = document.querySelector(`${section}-btn`)
		const index = Array.prototype.indexOf.call(currentSectionBtn.parentNode.children, currentSectionBtn);
		UIkit.tab(currentSectionBtn.parentNode).show(index)
		await customStorage.setItem("activeTabIndex", `${index}`)
	})
}

function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => resolve(reader.result); // содержит data:*/*;base64,...
		reader.onerror = () => reject(reader.error);

		reader.readAsDataURL(file);
	});
}
function textWrap(count) {
	if (count == 0)
		return `файлы не выбраны`
	if (count == 1)
		return `${count} файл будет загружен`
	if (count >= 2 && count <= 4)
		return `${count} файла будет загружено`
	return `${count} файлов будет загружено`

}
function updateFilesCount() {
	document.querySelector("#collection-count").innerHTML = textWrap(document.querySelector("#collection-files").files.length)
}

function loadfiles(event) {
	event.preventDefault()
	document.querySelector("#collection-files").click()
}

async function createCollection(event) {
	event.preventDefault()
	let name = document.querySelector("#collection-name").value.toUpperCase()
	if (name.length == 0)
		return alert("Ошибка: не задано имя коллекции")

	let collections = {}
	try {
		collections = JSON.parse(await customStorage.getItem("collections"))
	} catch {

	}
	if (collections == null)
		collections = {}

	if (name in collections)
		return alert("Ошибка: имя уже используется")

	let files = document.querySelector("#collection-files").files
	if (files.length == 0)
		return alert("Ошибка: Коллекция пуста")

	let collection = {}
	for (let file of files) {
		collection[file.name] = await fileToBase64(file)
	}

	collections[name] = collection;
	await customStorage.setItem("collections", JSON.stringify(collections))
	let collectionIndex = Object.keys(collections).length
	loadCollection(collections[name], name, collectionIndex)
	updateFilesCount()
	

	setSection(`#collection-${collectionIndex}`)
}

async function onFilesLoaded()
{
	await createCollectionSlider()
	updateFilesCount()

	if (document.querySelector("#collection-files").files.length != 0)
		document.querySelector("#select-files").innerHTML = "Изменить"
	else
		document.querySelector("#select-files").innerHTML = "Выбрать файлы"
	
}
async function createCollectionSlider()
{
	let files = document.querySelector("#collection-files").files

	let collection = {}
	for (let file of files) {
		collection[file.name] = await fileToBase64(file)
	}
	const currentCollection = document.querySelector(".current-collection")
	while (currentCollection.firstChild)
		currentCollection.removeChild(currentCollection.firstChild)

	for (let key in collection)
	{
		let div = document.createElement("div")
		div.insertAdjacentHTML("beforeend", `<span class="uk-text">${key}</span>`)
		div.appendChild(createCard(key, collection[key]))
		currentCollection.appendChild(div)
	}
}


async function shuffle (array)  {
	for (let i = array.length - 1; i > 0; i--) 
	{
		let j = Math.floor(Math.random() * (i + 1))
		let temp = array[i]
		array[i] = array[j]
		array[j] = temp
	}
	return array
}

function createCardBody(title, src, customTitile = undefined)
{
	return  `
	<span class="current-card-title uk-text uj-text-small uk-text-nowrap">${customTitile ? customTitile : title}</span>
	<img class="current-card-image uk-height-large uk-flex uk-flex-center uk-flex-middle uk-background-cover uk-light" src="${src}" uk-img>
`
}
function createCard(title, src, customTitile = undefined)
{
	let card = document.createElement("div")
	card.className = "uk-padding-none uk-panel uk-width-1-1@m"
	card.insertAdjacentHTML('beforeend', createCardBody(title, src, customTitile))

	return card
}

async function addRefrehButton(collectionNode, referesh)
{
	collectionNode.insertAdjacentHTML('beforeend', `
		<a class="refresh" href="#" uk-icon="icon: refresh">Перезапустить </a>`)

	const refresh = collectionNode.querySelector(".refresh")
	refresh.addEventListener("click", referesh)
}

async function createShuffleCard(collectionNode, keys, collection, collectionName = undefined)
{
	let shuffler = new Shuffler(keys);
	
	let currencCollectionInfoStr = await customStorage.getItem(collectionName);
	let collectionInfo = JSON.parse(currencCollectionInfoStr)

	if (collectionName && collectionInfo)
		shuffler.config = collectionInfo
	else {
		await customStorage.setItem(collectionName, JSON.stringify(shuffler.config))
	}

	let refresh = async () => {
		shuffler.refresh()
		await customStorage.setItem(collectionName, JSON.stringify(shuffler.config))


		card.querySelector(".current-card-title").innerHTML = shuffler.title
		card.querySelector(".current-card-image").src = collection[shuffler.currentValue]
	}
	
	await addRefrehButton(collectionNode, refresh)


	let card = createCard(shuffler.currentValue, collection[shuffler.currentValue], shuffler.title)

	async function onclick()
	{
		shuffler.update()


		card.querySelector(".current-card-title").innerHTML = shuffler.title
		card.querySelector(".current-card-image").src = collection[shuffler.currentValue]
	}
	
	card.addEventListener("click", onclick)

	return card
}

async function loadCollection(collection, key, collectionIndex) {
	const headerMenuBar = document.querySelector("#header-menu-bar")
	headerMenuBar.insertAdjacentHTML('beforeend', `
        <li class="uk-active uk-text-decoration-none" id="collection-${collectionIndex}-btn"><a href="#"class="uk-text-decoration-none"  onclick="setSection('#collection-${collectionIndex}')">${key}</a></li>
      `)

	let collectionKeys = Object.keys(collection)

	const collectionNode = document.createElement("div")
	collectionNode.className = "section uk-flex-column uk-margin uk-padding-small"
	collectionNode.id = `collection-${collectionIndex}`
	collectionNode.style.display = "none"
	document.body.appendChild(collectionNode)




	collectionNode.appendChild(await createShuffleCard(collectionNode, collectionKeys, collection, key))

	collectionNode.insertAdjacentHTML('beforeend', `
		<button class="uk-button uk-button-default uk-button-danger uk-margin-small-top" onclick="removeActiveCollection(event)">Удалить</button>
		`)

}

async function loadCollections() {
	let collections = {}
	try {
		collections = JSON.parse(await customStorage.getItem("collections"))
	} catch {
	}
	if (collections == null)
		collections = {}

	let collectionIndex = 0;
	for (let key in collections) {
		loadCollection(collections[key], key, collectionIndex)
		collectionIndex += 1;
	}
}

async function removeCollection(id) {
	let index = id.slice("collection-".length)
	let name = document.querySelector(`#collection-${index}-btn`).firstChild.innerHTML.toUpperCase()
	let collections = {}
	try {
		collections = JSON.parse(await customStorage.getItem("collections"))
	} catch {
	}
	if (collections == null)
		collections = {}

	let newCollections = {}
	for (let key in collections) {
		if (key == name)
			continue;

		newCollections[key] = collections[key];
	}
	await customStorage.setItem("collections", JSON.stringify(newCollections))

	const collection = document.querySelector(`.section#${id}`);
	collection.parentNode.removeChild(collection)

	const collectionButton = document.querySelector(`#collection-${index}-btn`)
	const tab = collectionButton.parentNode
	const currentIndex = Array.prototype.indexOf.call(tab.children, collectionButton);
	const newIndex = Math.max(currentIndex-1, 0)
	const newActiveSection = Array.from(tab.children)[newIndex]
	tab.removeChild(collectionButton)

	
	setSection(`#${newActiveSection.id.slice(0, -4)}`)
}

async function removeActiveCollection(event) {
	event.preventDefault()
	await removeCollection(document.querySelector(".section.active").id)
	setSection("#settings")
}




// Открываем IndexedDB и создаём объект хранилища для строк
const request = indexedDB.open("LargeStringDB", 1);

request.onupgradeneeded = function (event) {
	const db = event.target.result;

	// Создаем хранилище с объектами (object store) для строк
	if (!db.objectStoreNames.contains("strings")) {
		db.createObjectStore("strings", { keyPath: "id" });
	}
};


customStorage.onInitialized = async () => {

	updateFilesCount()
	await loadCollections()
	const activeTabIndex = await customStorage.getItem("activeTabIndex");
	const newActiveSection = Array.from(document.querySelector("#header-menu-bar").children)[activeTabIndex]
	setSection(`#${newActiveSection.id.slice(0, -4)}`)
}

async function removeAllCollection(event) {
	event.preventDefault()

	const sections = Array.from(document.querySelectorAll(".section"))
	for(let section of sections){
		if (section.id != "settings")
		{
			console.log(section.id)
			requestAnimationFrame(async()=>{
    	        await removeCollection(section.id)
			})
	}
	}
	await customStorage.clear()
}