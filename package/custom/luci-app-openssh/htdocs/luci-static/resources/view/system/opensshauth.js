'use strict';
'require view';
'require fs';
'require ui';

var confPath = '/etc/ssh/sshd_config.d/50-luci-app-openssh.conf';
var canWrite = L.hasViewPermission();

function parseConfig(text) {
	var values = {
		PermitRootLogin: 'prohibit-password',
		PasswordAuthentication: 'yes'
	};

	(text || '').split(/\n/).forEach(function(line) {
		var m = line.match(/^\s*(PermitRootLogin|PasswordAuthentication)\s+(\S+)/);
		if (m)
			values[m[1]] = m[2];
	});

	return values;
}

function configText(values) {
	return [
		'# Managed by luci-app-openssh',
		'PermitRootLogin ' + values.PermitRootLogin,
		'PasswordAuthentication ' + values.PasswordAuthentication,
		'KbdInteractiveAuthentication no',
		'AuthorizedKeysFile .ssh/authorized_keys',
		''
	].join('\n');
}

function option(value, label, selected) {
	return E('option', { value: value, selected: selected ? 'selected' : null }, [ label ]);
}

function row(id, label, description, control) {
	return E('div', { 'class': 'cbi-value' }, [
		E('label', { 'class': 'cbi-value-title', 'for': id }, [ label ]),
		E('div', { 'class': 'cbi-value-field' }, [
			control,
			description ? E('div', { 'class': 'cbi-value-description' }, [ description ]) : ''
		])
	]);
}

function save(values) {
	return fs.write(confPath, configText(values), 384)
		.then(function() { return fs.exec('/etc/init.d/sshd', [ 'restart' ]); })
		.then(function() { ui.addNotification(null, E('p', _('OpenSSH settings saved and sshd restarted.'))); })
		.catch(function(e) { ui.addNotification(null, E('p', e.message)); });
}

return view.extend({
	load: function() {
		return fs.read(confPath).catch(function() { return ''; });
	},

	render: function(text) {
		var values = parseConfig(text);

		var permitRoot = E('select', {
			'id': 'openssh-permit-root-login',
			'class': 'cbi-input-select',
			disabled: canWrite ? null : 'disabled'
		}, [
			option('prohibit-password', _('Keys only'), values.PermitRootLogin === 'prohibit-password'),
			option('yes', _('Password and keys'), values.PermitRootLogin === 'yes'),
			option('no', _('Disabled'), values.PermitRootLogin === 'no')
		]);

		var passwordAuth = E('select', {
			'id': 'openssh-password-auth',
			'class': 'cbi-input-select',
			disabled: canWrite ? null : 'disabled'
		}, [
			option('yes', _('Enabled'), values.PasswordAuthentication === 'yes'),
			option('no', _('Disabled'), values.PasswordAuthentication === 'no')
		]);

		return E('div', {}, [
			E('h2', _('OpenSSH Authentication')),
			E('div', { 'class': 'cbi-section' }, [
				row('openssh-permit-root-login', _('Root login'), _('Controls whether root may log in over OpenSSH.'), permitRoot),
				row('openssh-password-auth', _('Password authentication'), _('Controls password authentication for OpenSSH users.'), passwordAuth),
				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-save',
						disabled: canWrite ? null : 'disabled',
						click: function() {
							return save({
								PermitRootLogin: permitRoot.value,
								PasswordAuthentication: passwordAuth.value
							});
						}
					}, [ _('Save & Restart SSH') ])
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
