const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const stages = ['Corte', 'Motagem', 'Acabamento', 'Revisão'];
let currentStage = 1;
let historyEntries = [];
let toastTimer;

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
}
function updateStages() {
  $$('.stage-item').forEach((item, index) => {
    item.classList.toggle('completed', index < currentStage);
    item.classList.toggle('current', index === currentStage);
    item.classList.toggle('future', index > currentStage);
    item.setAttribute('aria-current', index === currentStage ? 'step' : 'false');
  });
  $('#prevStageBtn').disabled = currentStage === 0;
  $('#nextStageBtn').disabled = currentStage === stages.length - 1;
  $('#nextStageBtn').textContent = currentStage === stages.length - 1 ? 'Última etapa' : 'Avançar etapa';
}
function setStatus(status) {
  $('#statusText').textContent = status;
  const pill = $('#statusPill');
  pill.classList.remove('status-waiting', 'status-blocked', 'status-done');
  if (status === 'Aguardando material') pill.classList.add('status-waiting');
  if (status === 'Impedida') pill.classList.add('status-blocked');
  if (status === 'Concluída') pill.classList.add('status-done');
  if (status === 'Concluída') {
    currentStage = stages.length - 1;
    updateStages();
  }
}
function renderHistory() {
  const list = $('#historyList');
  list.replaceChildren();
  if (!historyEntries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-history';
    empty.textContent = 'Nenhum registro adicionado nesta sessão.';
    list.append(empty);
    return;
  }
  historyEntries.slice().reverse().forEach(entry => {
    const row = document.createElement('article');
    row.className = 'history-entry';
    const text = document.createElement('p');
    text.textContent = entry.text;
    const meta = document.createElement('small');
    meta.textContent = `${entry.date} • ${entry.stage} • ${entry.code}`;
    row.append(text, meta);
    list.append(row);
  });
}
function nowFormatted() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
}
$('#footerYear').textContent = new Date().getFullYear();

$('#homeBtn').addEventListener('click', () => {
  $('#homeBtn').classList.add('active');
  $('#loginBtn').classList.remove('active');
  $('#dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#brandHome').addEventListener('click', (event) => {
  event.preventDefault();
  $('#homeBtn').click();
});
$('#loginBtn').addEventListener('click', () => {
  $('#loginBtn').classList.add('active');
  $('#homeBtn').classList.remove('active');
  openDialog('loginDialog');
});
$('#loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const username = $('#username').value.trim();
  if (!username || !$('#password').value) return;
  $('#loginDialog').close();
  showToast(`Acesso de demonstração iniciado para ${username}.`);
  $('#loginForm').reset();
});
$('#editDetailsBtn').addEventListener('click', () => {
  $('#editCode').value = $('#codeValue').textContent;
  $('#editType').value = $('#typeValue').textContent;
  $('#editLocation').value = $('#locationValue').textContent;
  openDialog('detailsDialog');
});
$('#detailsForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = $('#editCode').value.trim();
  const location = $('#editLocation').value.trim();
  if (!code || !location) return;
  $('#codeValue').textContent = code;
  $('#typeValue').textContent = $('#editType').value;
  $('#locationValue').textContent = location;
  $('#detailsDialog').close();
  showToast('Identificação atualizada com sucesso.');
});
$('#changeStatusBtn').addEventListener('click', () => {
  $('#statusSelect').value = $('#statusText').textContent;
  openDialog('statusDialog');
});
$('#statusForm').addEventListener('submit', (event) => {
  event.preventDefault();
  setStatus($('#statusSelect').value);
  $('#statusDialog').close();
  showToast(`Status alterado para: ${$('#statusText').textContent}.`);
});
$('#changeResponsibleBtn').addEventListener('click', () => {
  $('#responsibleInput').value = $('#responsibleValue').textContent;
  openDialog('responsibleDialog');
});
$('#responsibleForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = $('#responsibleInput').value.trim();
  if (!value) return;
  $('#responsibleValue').textContent = value;
  $('#responsibleDialog').close();
  showToast('Responsável atualizado com sucesso.');
});
$('#prevStageBtn').addEventListener('click', () => {
  if (currentStage > 0) {
    currentStage--;
    updateStages();
    showToast(`Etapa atual: ${stages[currentStage]}.`);
  }
});
$('#nextStageBtn').addEventListener('click', () => {
  if (currentStage < stages.length - 1) {
    currentStage++;
    updateStages();
    showToast(`Etapa atual: ${stages[currentStage]}.`);
    if (currentStage === stages.length - 1) showToast('A esquadria chegou à etapa de Revisão.');
  }
});
$('#noteForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const text = $('#observation').value.trim();
  if (!text) {
    $('#observation').focus();
    showToast('Digite uma observação antes de registrar.');
    return;
  }
  historyEntries.push({
    text,
    date: nowFormatted(),
    stage: stages[currentStage],
    code: $('#codeValue').textContent
  });
  renderHistory();
  $('#observation').value = '';
  $('#charCount').textContent = '0/500';
  showToast('Observação registrada com sucesso.');
});
$('#observation').addEventListener('input', () => {
  $('#charCount').textContent = `${$('#observation').value.length}/500`;
});
$('#clearHistoryBtn').addEventListener('click', () => {
  if (!historyEntries.length) {
    showToast('O histórico já está vazio.');
    return;
  }
  if (confirm('Deseja apagar todos os registros desta sessão?')) {
    historyEntries = [];
    renderHistory();
    showToast('Histórico limpo.');
  }
});
$$('.stage-item').forEach((item, index) => {
  item.tabIndex = 0;
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', `Selecionar etapa ${stages[index]}`);
  const selectStage = () => {
    currentStage = index;
    updateStages();
    showToast(`Etapa selecionada: ${stages[currentStage]}.`);
  };
  item.addEventListener('click', selectStage);
  item.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectStage();
    }
  });
});
$$('dialog').forEach(dialog => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});
updateStages();
renderHistory();
