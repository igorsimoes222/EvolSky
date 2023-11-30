const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use('/public/css', express.static(__dirname + '/public/css', { 'extensions': ['css'], 'index': false }));


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const db = new sqlite3.Database('database.db');

function getTableName(clinica) {
    switch (clinica) {
        case 'Clinica AZ Radiologia':
            return 'pacientes_azradiologia';
        case 'Clinica RR Imagens':
            return 'pacientes_rrimagens';
        case 'Clinica Serraro':
            return 'pacientes_serraro';
        default:
            return null;
    }
}

app.get('/choose-clinic', (req, res) => {
    res.render('chooseClinic');
});

app.post('/clinic', (req, res) => {
    const selectedClinic = req.body.clinic;
    res.redirect(`/clinic-form?clinic=${encodeURIComponent(selectedClinic)}`);
});

app.get('/clinic-form', (req, res) => {
    const selectedClinic = req.query.clinic;
    res.render('clinicForm', { clinic: selectedClinic });
});

app.post('/submit', async (req, res) => {
    const { nome, codigo, autor, clinica } = req.body;
    const tableName = getTableName(clinica);

    if (!tableName) {
        res.send('Clínica não reconhecida');
        return;
    }

    try {
        // Log dos valores a serem inseridos
        console.log('Valores a serem inseridos:', { nome, codigo, autor, clinica });

        // Log do nome da tabela
        console.log('Nome da tabela:', tableName);

        // Log dos dados antes da inserção
        const rowsBeforeInsert = await db.all(`SELECT * FROM ${tableName}`);
        console.log('Dados antes da inserção:', rowsBeforeInsert);

        // Inserção
        await db.run(`INSERT INTO ${tableName} (nome, codigo, autor, clinica) VALUES (?, ?, ?, ?)`, [nome, codigo, autor, clinica]);

        // Log dos dados após a inserção
        const rowsAfterInsert = await db.all(`SELECT * FROM ${tableName}`);
        console.log('Dados após a inserção:', rowsAfterInsert);

        res.redirect(`/clinic-view?clinic=${encodeURIComponent(clinica)}`);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Erro ao inserir dados na clínica');
    }
});



app.get('/clinic-view', async (req, res) => {
    const selectedClinic = req.query.clinic;
    const tableName = getTableName(selectedClinic);

    if (!tableName) {
        res.send('Clínica não reconhecida');s
        return;
    }

    try {
        // Log do número de pacientes antes de renderizar
        const rowsBeforeRender = await db.all(`SELECT * FROM ${tableName}`);
        console.log('Número de pacientes antes de renderizar:', rowsBeforeRender.length);

        // Recuperação dos dados
        const rows = await db.all(`SELECT * FROM ${tableName}`);
        console.log('Número de pacientes antes de renderizar:', rows.length);
        console.log('Dados na visualização da clínica:', rows);
        res.render('clinicView', { clinic: selectedClinic, clinicPatients: rows, numberOfPatients: rows.length });



    } catch (err) {
        console.log(err.message);
        res.status(500).send('Erro ao buscar dados da clínica');
    }
});



app.get('/table', (req, res) => {
    res.render('table');
});


app.post('/submit-serraro', async (req, res) => {
    const { nome, codigo, autor, clinica } = req.body;

    try {
        const tableName = getTableName(clinica);

        if (!tableName) {
            res.send('Clínica não reconhecida');
            return;
        }

        await db.run(`INSERT INTO ${tableName} (nome, codigo, autor, clinica) VALUES (?, ?, ?, ?)`, [nome, codigo, autor, clinica]);
        res.redirect(`/clinic-view?clinic=${encodeURIComponent(clinica)}`);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Erro ao inserir dados na clínica Serraro');
    }
});

app.get('/clinic-table-serraro', async (req, res) => {
    const selectedClinic = 'Clinica Serraro';
    const tableName = getTableName(selectedClinic);

    if (!tableName) {
        res.send('Clínica não reconhecida');
        return;
    }

    try {
        const rows = await db.all(`SELECT * FROM ${tableName}`);
        res.render('table', { patients: rows, clinic: selectedClinic });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Erro ao buscar dados da clínica Serraro');
    }
});



app.get('/view-all-clinics', async (req, res) => {
    const clinics = [
        { name: 'Clinica AZ Radiologia', tableName: 'pacientes_azradiologia' },
        { name: 'Clinica RR Imagens', tableName: 'pacientes_rrimagens' },
        { name: 'Clinica Serraro', tableName: 'pacientes_serraro' }
    ];

    try {
        const clinicData = await Promise.all(clinics.map(async clinic => {
            const tableName = clinic.tableName;
            const clinicName = clinic.name;
            const patients = await db.all(`SELECT * FROM ${tableName}`);
            return { clinic: clinicName, patients };
        }));

        res.render('viewAllClinics', { clinicData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao buscar dados das clínicas');
    }
});



