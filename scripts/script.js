document.addEventListener('DOMContentLoaded', function () {

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultDiv = document.getElementById('result');
    const parsedNotes = document.getElementById('parsed-notes');
    const errorMessage = document.getElementById('error-message');
    const bookCountEl = document.getElementById('book-count');
    const highlightCountEl = document.getElementById('highlight-count');

    // Hide error message initially
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        resultDiv.style.display = 'none';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

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
        if (file) {
            handleFile(file);
        }
    });

    fileInput.addEventListener('change', function () {
        const file = fileInput.files[0];
        if (file) {
            handleFile(file);
        }
    });

    dropZone.addEventListener('click', function () {
        fileInput.click();
    });

    // Keyboard accessibility for drop zone
    dropZone.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });


    function handleFile(file) {
        hideError();

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.txt')) {
            showError('Please upload a .txt file. Kindle clippings are stored in "My Clippings.txt".');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('File is too large. Please upload a file smaller than 10MB.');
            return;
        }

        const reader = new FileReader();

        reader.onerror = function () {
            showError('Error reading file. Please try again.');
        };

        reader.onload = function (e) {
            const contents = e.target.result;
            
            // Check if file is empty
            if (!contents || contents.trim().length === 0) {
                showError('The file appears to be empty. Please upload a valid clippings file.');
                return;
            }

            // Check for Kindle clippings format (should contain separator)
            if (!contents.includes('==========')) {
                showError('This doesn\'t look like a Kindle clippings file. The file should contain highlights separated by "==========".');
                return;
            }

            try {
                const books = parseClippings(contents);
                
                if (books.size === 0) {
                    showError('No highlights found in the file. Please check if the file contains valid Kindle clippings.');
                    return;
                }

                displayBooks(books);
                resultDiv.style.display = 'block';
            } catch (err) {
                showError('Error parsing the clippings file. Please make sure it\'s a valid Kindle clippings file.');
                console.error('Parsing error:', err);
            }
        };

        reader.readAsText(file);
    }

    function parseClippings(contents) {
        const books = new Map();
        
        // Split by the Kindle separator
        const entries = contents.split('==========');
        
        for (const entry of entries) {
            const lines = entry.trim().split('\n').filter(line => line.trim() !== '');
            
            // Each entry should have at least 3 lines: book title, metadata, and content
            if (lines.length < 3) continue;
            
            // First line is the book title (and author)
            let bookTitle = lines[0].trim();
            if (bookTitle.length > 100) {
                bookTitle = bookTitle.substring(0, 100).trim() + '...';
            }
            
            // Skip if no book title
            if (!bookTitle) continue;
            
            // The highlight/note content is typically the last line(s) after metadata
            // Metadata line usually starts with "- Your Highlight" or "- Your Note"
            let contentStartIndex = 1;
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].startsWith('- Your') || lines[i].startsWith('- La subrayado') || lines[i].startsWith('- Il tuo')) {
                    contentStartIndex = i + 1;
                    break;
                }
            }
            
            // Get the content (could be multiple lines)
            const content = lines.slice(contentStartIndex).join('\n').trim();
            
            // Skip empty content
            if (!content) continue;
            
            // Add to the book's quotes
            if (books.has(bookTitle)) {
                const quotes = books.get(bookTitle);
                // Avoid duplicate quotes
                if (!quotes.includes(content)) {
                    quotes.push(content);
                }
            } else {
                books.set(bookTitle, [content]);
            }
        }
        
        return books;
    }

    function displayBooks(map) {
        parsedNotes.innerHTML = '';
        
        let totalBooks = 0;
        let totalHighlights = 0;

        map.forEach((quotes, book) => {
            totalBooks++;
            totalHighlights += quotes.length;

            const bookItem = document.createElement('div');
            bookItem.className = 'book-item';

            const toggleButton = document.createElement('button');
            toggleButton.className = 'book-toggle';
            toggleButton.setAttribute('aria-expanded', 'false');
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'book-title';
            titleSpan.textContent = book;
            
            const countSpan = document.createElement('span');
            countSpan.className = 'quote-count';
            countSpan.textContent = `${quotes.length} highlight${quotes.length !== 1 ? 's' : ''}`;
            
            const chevron = document.createElement('span');
            chevron.className = 'chevron';
            chevron.textContent = '▼';
            
            toggleButton.appendChild(titleSpan);
            toggleButton.appendChild(countSpan);
            toggleButton.appendChild(chevron);

            const quotesList = document.createElement('ul');
            quotesList.className = 'quotes-list';

            quotes.forEach(quote => {
                const quoteItem = document.createElement('li');
                quoteItem.textContent = quote;
                quotesList.appendChild(quoteItem);
            });

            toggleButton.addEventListener('click', function () {
                const isExpanded = quotesList.classList.contains('expanded');
                quotesList.classList.toggle('expanded');
                toggleButton.classList.toggle('expanded');
                toggleButton.setAttribute('aria-expanded', !isExpanded);
            });

            bookItem.appendChild(toggleButton);
            bookItem.appendChild(quotesList);
            parsedNotes.appendChild(bookItem);
        });

        // Update stats
        bookCountEl.textContent = totalBooks;
        highlightCountEl.textContent = totalHighlights;
    }

});