document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('nav ul li a');
  const convertInput = document.getElementById('convert-input');
  const convertButton = document.getElementById('convert-button');
  const convertResult = document.getElementById('convert-result');
  const baseCurrencySelect = document.getElementById('base-currency');
  const ratesTableBody = document.querySelector('#rates-table tbody');

  const apiKey = '6faf896988f72f8558c69c42';
  const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;
  const currencyInfoUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/codes`;

  let availableCurrencies = [];
  let currencyNames = {};

  function showPage(hash) {
    pages.forEach(page => page.classList.remove('active'));
    document.querySelector(hash).classList.add('active');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(e.target.getAttribute('href'));
    });
  });

  function getDecimalPlaces(value) {
    if (value < 0.01) {
      return 8;
    }
    if (value < 1) {
      return 4;
    }
    return 2;
  }

  function getRates(baseCurrency) {
    fetch(`${apiUrl}${baseCurrency}`)
      .then(response => response.json())
      .then(data => {
        ratesTableBody.innerHTML = '';
        // for (const [currency, rate] of Object.entries(data.conversion_rates)) {
        Object.entries(data.conversion_rates).forEach(([currency, rate]) => {
          if (baseCurrency === currency) return;

          const tr = document.createElement('tr');
          const currencyName = currencyNames[currency] || currency;

          const fromBaseRate = rate;
          const toBaseRate = (1 / rate).toFixed(getDecimalPlaces((1 / rate)));

          tr.innerHTML = `
            <td>${currency} - ${currencyName}</td>
            <td>1 ${currency} = ${toBaseRate} ${baseCurrency}</td>
            <td>1 ${baseCurrency} = ${fromBaseRate} ${currency}</td>
          `;
          ratesTableBody.appendChild(tr);
        });
      })
      .catch(error => console.error('Error fetching rates:', error));
  }

  function convertCurrency(query) {
    const match = query.match(/(\d+)\s+(\w+)\s+in\s+(\w+)/);
    if (match) {
      const amount = match[1];
      const fromCurrency = match[2].toUpperCase();
      const toCurrency = match[3].toUpperCase();

      if (!availableCurrencies.includes(fromCurrency)) {
        convertResult.textContent = `Currency code ${fromCurrency} does not exist`;
        return;
      }

      if (!availableCurrencies.includes(toCurrency)) {
        convertResult.textContent = `Currency code ${toCurrency} does not exist`;
        return;
      }

      fetch(`${apiUrl}${fromCurrency}`)
        .then(response => response.json())
        .then(data => {
          const rate = data.conversion_rates[toCurrency];
          if (rate) {
            const result = amount * rate;
            convertResult.textContent = `${amount} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`;
          } else {
            convertResult.textContent = `Cannot convert to ${toCurrency}`;
          }
        })
        .catch(error => console.error('Error converting currency:', error));
    } else {
      convertResult.textContent = 'Invalid input format';
    }
  }

  convertButton.addEventListener('click', () => {
    convertCurrency(convertInput.value);
  });

  convertInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      convertCurrency(convertInput.value);
    }
  });

  baseCurrencySelect.addEventListener('change', () => {
    getRates(baseCurrencySelect.value);
  });

  fetch(`${currencyInfoUrl}`)
    .then(response => response.json())
    .then(data => {
      availableCurrencies = data.supported_codes.map(code => code[0]);
      currencyNames = data.supported_codes.reduce((acc, [code, name]) => {
        acc[code] = name;
        return acc;
      }, {});
      baseCurrencySelect.innerHTML = availableCurrencies.map(currency => {
        const currencyName = currencyNames[currency] || currency;
        return `<option value="${currency}">${currency} - ${currencyName}</option>`;
      }).join('');
      baseCurrencySelect.value = 'RUB';
      getRates('RUB');
    })
    .catch(error => console.error('Error initializing rates:', error));

  // Show the converter page by default
  showPage('#converter');
});
