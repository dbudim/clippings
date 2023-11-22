document.addEventListener('DOMContentLoaded', function () {

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultDiv = document.getElementById('result');
    const parsedNotes = document.getElementById('parsed-notes');

    dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropZone.classList.add('hover');
    });

    dropZone.addEventListener('dragleave', function () {
        dropZone.classList.remove('hover');
    });

    dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropZone.classList.remove('hover');

        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    fileInput.addEventListener('change', function () {
        const file = fileInput.files[0];
        handleFile(file);
    });

    dropZone.addEventListener('click', function () {
        fileInput.click();
    });


    function handleFile(file) {
        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const contents = e.target.result;
                parsedNotes.textContent = contents;


                let books = new Map();

                let bookIndex = 0;
                let quoteIndex = 3;
                let linesContent = contents.split("\n");

                while (quoteIndex < linesContent.length) {

                    let book = linesContent[bookIndex].length > 100
                        ? linesContent[bookIndex].substring(0, 100).trim() + "..."
                        : linesContent[bookIndex].trim()

                    let quote = linesContent[quoteIndex].trim();

                    if (books.has(book)) {
                        let quotes = books.get(book);
                        quotes.push(quote);
                    } else {
                        let quotes = [];
                        quotes.push(quote);
                        books.set(book, quotes);
                    }

                    quoteIndex += 5;
                    bookIndex += 5;
                }
                displayBooks(books)
                resultDiv.style.display = 'block';
            };

            reader.readAsText(file);
        }
    }

    function displayBooks(map) {
        const parsedNotes = document.getElementById('parsed-notes');
        parsedNotes.innerHTML = '';

        map.forEach((quotes, book) => {
            const bookItem = document.createElement('div');
            const toggleButton = document.createElement('button');
            toggleButton.textContent = book;
            toggleButton.addEventListener('click', function () {
                quotesList.style.display = (quotesList.style.display === 'none' || !quotesList.style.display) ? 'block' : 'none';
            });

            const quotesList = document.createElement('ul');
            quotesList.style.display = 'none';

            quotes.forEach(quote => {
                const quoteItem = document.createElement('li');
                quoteItem.textContent = quote;
                quotesList.appendChild(quoteItem);
            });

            bookItem.appendChild(toggleButton);
            bookItem.appendChild(quotesList);
            parsedNotes.appendChild(bookItem);
        });
    }


});