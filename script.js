document.getElementById('processButton').addEventListener('click', () => {
  const files = document.getElementById('fileInput').files;
  const mode = document.getElementById('modeSelect').value;
  const fileList = document.getElementById('fileList');
  const globalName = document.getElementById('nameInput').value.trim();
  const addFileName = document.getElementById('addFileNameCheckbox').checked;

  fileList.innerHTML = '';

  if (files.length === 0) {
    alert('Silakan unggah file terlebih dahulu.');
    return;
  }

  if (!globalName && !addFileName) {
    alert('Nama kontak tidak boleh kosong jika opsi tidak dicentang.');
    return;
  }

  Array.from(files).forEach(file => {
    const listItem = document.createElement('div');
    listItem.classList.add('file-item');
    const fileName = file.name;
    const [namePart] = fileName.match(/(.+)(\.[^.]+$)/).slice(1);

    let extraName = '';
    try {
      if (mode === 'normal' || mode === 'fileName') {
        extraName = namePart;
      } else if (mode === 'inBrackets') {
        const match = namePart.match(/\((.*?)\)/);
        if (match) {
          extraName = match[1];
        } else {
          throw new Error('Tidak ada tanda kurung dalam nama file.');
        }
      } else if (mode.startsWith('last')) {
        const charCount = parseInt(mode.replace('last', ''), 10);
        if (isNaN(charCount) || charCount <= 0) {
          throw new Error('Jumlah karakter terakhir harus angka.');
        }
        if (namePart.length >= charCount) {
          extraName = namePart.slice(-charCount);
        } else {
          throw new Error('Jumlah karakter melebihi panjang nama file.');
        }
      } else {
        throw new Error('Mode tidak dikenal.');
      }

      generateDownloadLink(file, namePart + '.vcf', globalName, addFileName, extraName, listItem);

    } catch (error) {
      listItem.classList.add('error');
      listItem.innerHTML = `<span>${fileName}</span><span class="error-msg">${error.message}</span>`;
    }

    fileList.appendChild(listItem);
  });
});

function generateDownloadLink(file, newFileName, globalName, addFileName, extraName, listItem) {
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split('\n').filter(line => line.trim() !== '');
    let vcfContent = '';
    let index = 1;

    lines.forEach(line => {
      const contact = line.trim();
      if (/^\d{10,}$/.test(contact)) {
        let nameParts = [];

        if (globalName) nameParts.push(globalName);
        if (extraName) nameParts.push(extraName);
        nameParts.push(index);

        let contactName = '';
        if (addFileName && extraName) {
          contactName = (globalName ? `${globalName} ${extraName} ${index}` : `${extraName} ${index}`);
        } else {
          contactName = globalName ? `${globalName} ${index}` : '';
        }

        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL:${contact}\nEND:VCARD\n`;
        index++;
      }
    });

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
