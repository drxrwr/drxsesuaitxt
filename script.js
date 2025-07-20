document.getElementById('processButton').addEventListener('click', () => {
    const files = document.getElementById('fileInput').files;
    const mode = document.getElementById('modeSelect').value;
    const fileList = document.getElementById('fileList');
    const globalContactName = document.getElementById('nameInput').value.trim();
    const addFileName = document.getElementById('addFileNameCheckbox').checked;
    fileList.innerHTML = '';

    if (files.length === 0) {
        alert('Silakan unggah file terlebih dahulu.');
        return;
    }

    if (!globalContactName && !addFileName) {
        alert('Nama kontak tidak boleh kosong jika opsi tidak dicentang.');
        return;
    }

    Array.from(files).forEach(file => {
        const listItem = document.createElement('div');
        listItem.classList.add('file-item');
        const fileName = file.name;
        const [namePart, extension] = fileName.match(/(.+)(\.[^.]+$)/).slice(1);
        let newFileName = '';

        try {
            if (mode === 'normal') {
                newFileName = `${namePart}.vcf`;
            } else if (mode === 'inBrackets') {
                const match = namePart.match(/\((.*?)\)/);
                if (match) {
                    newFileName = `${match[1]}.vcf`;
                } else {
                    throw new Error('Tidak ada tanda kurung dalam nama file.');
                }
            } else if (mode.startsWith('last')) {
                const charCountStr = mode.replace('last', '');
                const charCount = parseInt(charCountStr, 10);

                if (isNaN(charCount) || charCount <= 0) {
                    throw new Error('Jumlah karakter terakhir harus berupa angka yang valid.');
                }

                if (namePart.length >= charCount) {
                    newFileName = `${namePart.slice(-charCount)}.vcf`;
                } else {
                    throw new Error('Jumlah karakter melebihi panjang nama file.');
                }
            } else if (mode === 'fileName') {
                newFileName = `${namePart}.vcf`;
            } else {
                throw new Error('Mode tidak dikenal. Harap pilih mode yang valid.');
            }

            generateDownloadLink(file, newFileName, globalContactName, addFileName, namePart, mode, listItem);

        } catch (error) {
            listItem.classList.add('error');
            listItem.innerHTML = `<span>${fileName}</span><span class="error-msg">${error.message}</span>`;
        }

        fileList.appendChild(listItem);
    });
});

function generateDownloadLink(file, newFileName, globalContactName, addFileName, fileBaseName, mode, listItem) {
    const reader = new FileReader();
    reader.onload = () => {
        const txtContent = reader.result;
        let localCounter = 1;
        let currentCategory = 'Anggota';

        const extracted = mode === 'inBrackets' ? (fileBaseName.match(/\((.*?)\)/) || [])[1] : null;

        const vcfContent = txtContent
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                const contact = line.trim();
                const newCategory = classifyContact(contact);
                if (newCategory) {
                    currentCategory = newCategory;
                    localCounter = 1;
                }

                if (/^\d+$/.test(contact)) {
                    let contactName = '';

                    if (globalContactName && addFileName && extracted) {
                        contactName = `${globalContactName} ${extracted} ${localCounter}`;
                    } else if (globalContactName && !addFileName) {
                        contactName = `${globalContactName} ${localCounter}`;
                    } else if (!globalContactName && addFileName && extracted) {
                        contactName = `${extracted} ${localCounter}`;
                    } else {
                        contactName = '';
                    }

                    if (!contactName) return '';

                    const fullContactName = currentCategory === 'Anggota' ? contactName : `${contactName} (${currentCategory})`;
                    const contactVcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${fullContactName}\nTEL:${contact}\nEND:VCARD\n`;
                    localCounter++;
                    return contactVcard;
                } else {
                    return '';
                }
            })
            .join('\n');

        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = newFileName;
        link.textContent = `Unduh ${newFileName}`;
        link.classList.add('download-link');
        listItem.appendChild(link);
        listItem.classList.add('success');
        listItem.innerHTML += `<span> → Tautan tersedia untuk diunduh</span>`;
    };
    reader.readAsText(file);
}

function classifyContact(contact) {
    if (contact.match(/管理号|管理|管理员|admin|Admin/)) {
        return 'Admin';
    } else if (contact.match(/水軍|小号|水军|navy|Navy/)) {
        return 'Navy';
    } else if (contact.match(/数据|客户|底料|进群资源|资料|Anggota/)) {
        return 'Anggota';
    } else {
        return null;
    }
}
