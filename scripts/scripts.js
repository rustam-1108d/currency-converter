document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('nav ul li a');
  const convertInput = document.getElementById('convert-input');
  const convertButton = document.getElementById('convert-button');
  const convertResult = document.getElementById('convert-result');
  const errorMessageConverter = document.getElementById('error-message-converter');
  const errorMessageRates = document.getElementById('error-message-rates');
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
    if (value >= 10) {
      return 2;
    }
    if (value >= 1) {
      return 4;
    }
    if (value >= 0.01) {
      return 6;
    }
    return 8;
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

          const fromBaseRate = rate.toFixed(getDecimalPlaces(rate));
          const reverseRate = (1 / rate);
          const toBaseRate = reverseRate.toFixed(getDecimalPlaces(reverseRate));

          tr.innerHTML = `
            <td>${currency} - ${currencyName}</td>
            <td>1 ${currency} = ${toBaseRate * 1} ${baseCurrency}</td>
            <td>1 ${baseCurrency} = ${fromBaseRate * 1} ${currency}</td>
          `;
          ratesTableBody.appendChild(tr);
        });
        errorMessageRates.textContent = '';
      })
      .catch(error => {
        console.error('Error fetching rates:', error);
        errorMessageRates.textContent = 'Exchange rates are currently unavailable.';
      });
  }

  function convertCurrency(query) {
    const match = query.trim().match(/^(\d+(?:[.,]\d+)?)\s+(\w+)\s+in\s+(\w+)$/);
    if (match) {
      const amount = match[1].replace(',', '.');
      const fromCurrency = match[2].toUpperCase();
      const toCurrency = match[3].toUpperCase();

      if (!availableCurrencies.includes(fromCurrency)) {
        convertResult.textContent = '';
        errorMessageConverter.textContent = `Currency code "${fromCurrency}" not found`;
        return;
      }

      if (!availableCurrencies.includes(toCurrency)) {
        convertResult.textContent = '';
        errorMessageConverter.textContent = `Currency code "${toCurrency}" not found`;
        return;
      }

      fetch(`${apiUrl}${fromCurrency}`)
        .then(response => response.json())
        .then(data => {
          const rate = data.conversion_rates[toCurrency];
          if (rate) {
            const result = amount * rate;
            const roundedResult = result.toFixed(getDecimalPlaces(result));
            convertResult.textContent = `${amount * 1} ${fromCurrency} = ${roundedResult * 1} ${toCurrency}`;
            errorMessageConverter.textContent = '';
          } else {
            convertResult.textContent = '';
            errorMessageConverter.textContent = `Cannot convert to ${toCurrency}`;
          }
        })
        .catch(error => {
          console.error('Error converting currency:', error);
          errorMessageConverter.textContent = 'Exchange rates are currently unavailable.';
        });
    } else {
      convertResult.textContent = '';
      errorMessageConverter.textContent = 'Invalid input format. Use the format: <amount> <from_currency> in <to_currency>. Example: 15 USD in RUB';
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
    .catch(error => {
      console.error('Error initializing rates:', error);
      errorMessageRates.textContent = 'Exchange rates are currently unavailable.';
    });

  // Show the converter page by default
  showPage('#converter');
});
