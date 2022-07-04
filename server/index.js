const express = require('express');
const mysql = require('mysql');
const util = require('util');
const cors = require('cors');
const { Console } = require('console');
const { appendFile } = require('fs');
const { query } = require('express');

const practica = express();
const port = 3000;
practica.use(express.json()); //permite el mapeo de la peticion json a object js
practica.use(cors()); //permite filtrar url clientes q puedan peticionar al servidor

// Conexion con mysql
const conexion = mysql.createConnection({
    host: 'localhost',
	user: 'root',
	password: '',
	database: 'biblioteca'
});

conexion.connect((error)=>{
    if(error) {
        throw error;
    }

    console.log('Conexion con la base de datos mysql establecida');
});

const qy = util.promisify(conexion.query).bind(conexion); // permite el uso de asyn-await en la conexion mysql


/**
 * GET para devolver todas las categorias
 * GET id para devolver uno solo
 * POST guardar una categoria nueva
 * PUT para modificar una categoria existente
 * DELETE para borrar una categoria existente
 * 
 * Ruta -> /categoria
 */

 /**
 * CATEGORIA
 */
practica.get('/categoria', async (req, res) => {
    try {
        // armo la consulta
        const query = 'SELECT * FROM categoria';
        //ejecutamos la query
        const respuesta = await qy(query);
        // el servidor responda 
        res.send({"respuesta" : respuesta});

       
        }

     catch(e){
            //marcar un error
            console.error(e.message);
     }
});

practica.get('/categoria/:id', async(req, res) =>{
    try {
        // armo la consulta
        const query = 'SELECT * FROM categoria WHERE id = ?';
        const respuesta = await qy(query, [req.params.id]);
        console.log(respuesta);

        //validar la categoria o sea verificar que exista 
        if( respuesta.length == 0){
            throw new Error ('Categoria no fue encontrada');

        }
        res.send({"respuesta" : respuesta});
    }
    catch (e){
    console.error(e.message);
    res.status(413).send(e.message); 

    }
})
practica.post('/categoria',  async(req, res) =>{
    try{
        //validar nombre de la categoria
        if(!req.body.nombre){
            throw new Error('Falta enviar el nombre')
        }
        //verificar que no exista previamente
        let query = 'SELECT id FROM categoria WHERE nombre = ?';

        let respuesta=await qy(query, [req.body.nombre.toLowerCase()]);
        
        if (respuesta.length > 0){
            throw new Error ('esa categoría ya existe');

        }
    //guardar la categoria nueva
    query= 'INSERT INTO categoria (nombre) VALUE (?)';
    respuesta= await qy(query, [req.body.nombre.toLowerCase()]);

    res.send({"respuesta" : respuesta});
    
    }
    catch(e){
        res.status(413). send({"Error": e.message});
    }
});
 
practica.delete( '/categoria/:id', async(req, res) =>{
    try{
        let query= 'SELECT * FROM libro WHERE categoria_id= ?';

        let respuesta = await qy(query, [req.params.id]);

        if (respuesta.length > 0){
            throw new Error ('esa categoría tiene libros asociados, no se puede borrar');

        }

        query= 'SELECT * FROM libro WHERE categoria_id= ?';
        respuesta = await qy(query, [req.params.id]);
        //valido que la categoria exista
        if (respuesta.length > 0){
            throw new Error ('esa categoría no existe');

        }
        query= 'DELETE FROM categoria WHERE id = ?';
        respuesta = await qy(query, [req.params.id]);

        res.send ('se borro correctamente');

    }
    catch(e){
        res.status(413). send({"Error": e.message});
        res.status(413). send("Error inesperado");
    }
});
    
/**
 * persona
 */
  
 practica.post('/persona', async (req, res) => {
    try {
        // Valido envio de los datos de la persona
        if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email) {
            throw new Error('Faltan datos');
        }

        // Verifico que el email no este registrado previamente
        let query = 'SELECT id FROM persona WHERE email = ?';

        let respuesta = await qy(query, [req.body.email.toLowerCase()]);

        if (respuesta.length > 0) { 
            throw new Error('El email ya se encuentra registrado');
        }

        // Guardo la nueva persona
        query = "INSERT INTO persona (nombre,apellido,alias,email) VALUES (?,?,?,?)";
        respuesta = await qy(query, [req.body.nombre,req.body.apellido,req.body.alias,req.body.email]);
	
		res.send({'Registro insertado': {"Nombre":req.body.nombre,"Apellido":req.body.apellido,"Alias":req.body.alias,"Email":req.body.email}});//responde todo
        
    }   
    catch(e){
        res.status(413).send({"Error": e.message});
    }
 });    




 practica.get('/persona', async (req, res) => {
    try {
        const query = 'SELECT * FROM persona';
        
        const respuesta = await qy(query);

        res.send({"respuesta": respuesta});
    }
    catch(e){
        // console.error(e.message);
        res.status(413).send({"Error": e.message});
    }
 });



 practica.get('/persona/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM persona WHERE id = ?';

        const respuesta = await qy(query, [req.params.id]);
        

        // valido que la persona solicitada exista previamente
        if (respuesta.length == 0) { 
            throw new Error('No se encuentra esa persona');
        }

        res.send({"respuesta": respuesta});
    }
    catch(e){
        res.status(413).send(e.message);
    }
 });


 practica.put('/persona/:id', async (req, res)=>{
    try {
       
       if (!req.body.nombre || !req.body.apellido || !req.body.alias || !req.body.email) {
           throw new Error("Te faltan datos");
       }
       
       let query = 'SELECT * FROM persona WHERE email = ? AND id <> ?';

       let respuesta = await qy(query, [req.body.email, req.params.id]);

       if (respuesta.length > 0) {
           throw new Error("El email de la persona que queres poner ahora ya existe");
       }

       query = 'SELECT * FROM persona WHERE id = ?';

       respuesta = await qy(query, [req.params.id]);

       if (respuesta.length == 0) {
           throw new Error("No se encuentra esa persona");
       }

       query = 'UPDATE persona SET nombre = ?, apellido = ?, alias = ?, email = ? WHERE id = ?';

       respuesta = await qy(query, [req.body.nombre.toLowerCase(),req.body.apellido.toLowerCase(),req.body.alias.toLowerCase(),req.body.email.toLowerCase(), req.params.id]);

    //    res.send({"Registros afectados": respuesta.affectedRows});
       res.send({'Registro actualizado': {"Nombre":req.body.nombre,"Apellido":req.body.apellido,"Alias":req.body.alias,"Email":req.body.email}});

    }
    catch(e){
       console.error(e.message);
       res.status(413).send({"Error": e.message});                  
   }
});


practica.delete('/persona/:id', async (req, res) => {
    try {
       let query = 'SELECT * FROM libro WHERE persona_id = ?';

       let respuesta = await qy(query, [req.params.id]);

       if (respuesta.length > 0) {
           throw new Error("Esta persona tiene libros asociados, no se puede borrar");
       }

       query = 'SELECT * FROM persona WHERE id = ?';

        respuesta = await qy(query, [req.params.id]);

        // valido que la persona solicitada exista previamente
        if (respuesta.length == 0) { 
            throw new Error('No existe la persona indicada');
        }

       query = 'DELETE FROM persona WHERE id = ?';

       respuesta = await qy(query, [req.params.id]);

       res.send('Se borro correctamente');
    }
    catch(e){
        res.status(413).send(e.message);
   }
});


/**
 * LIBRO
 */


practica.get('/libro', async (req, res) => {
    try {
        const query = 'SELECT * FROM libro';
        
        const respuesta = await qy(query);

        res.send({"respuesta": respuesta});
    }
    catch(e){
        console.error(e.message);
    }
 });



 practica.get('/libro/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM libro WHERE id = ?';

        const respuesta = await qy(query, [req.params.id]);
        console.log(respuesta);

        // valido que la libro solicitada exista previamente
        if (respuesta.length == 0) { 
            throw new Error('No se encuentra ese libro');
        }

        res.send({"respuesta": respuesta});
    }
    catch(e){
        res.status(413).send(e.message);//mensaje de error personalizado
    }
 });


 practica.post('/libro', async (req, res) => {
    try {
        // Valido envio de los datos del libro
        if (!req.body.nombre || !req.body.categoria_id) {
            throw new Error('Nombre y Categoria son datos obligatorios');
        }

        // Verifico que el libro no este registrado previamente
        let query = 'SELECT id FROM libro WHERE nombre = ?';

        let respuesta = await qy(query, [req.body.nombre.toLowerCase()]);

        if (respuesta.length > 0) { 
            throw new Error('El libro ya existe');
        }

        query = 'SELECT * FROM libro WHERE categoria_id = ?';

        respuesta = await qy(query, [req.body.categoria_id]);
        

        // valido que la categoria solicitada exista previamente
        if (respuesta.length == 0) { 
            throw new Error('No existe la categoria indicada');
        }

        query = 'SELECT * FROM persona WHERE id = ?';

        respuesta = await qy(query, [req.body.persona_id]);
        console.log(respuesta);
        console.log(req.body.persona_id);

        // valido que la persona solicitada exista previamente
        if (respuesta.length == 0 && req.body.persona_id != null) { 
            throw new Error('No existe la persona indicada');
        }

        // Guardo el nuevo libro
        query = "INSERT INTO libro (nombre,descripcion,categoria_id,persona_id) VALUES (?,?,?,?)";
        
        respuesta = await qy(query, [req.body.nombre,req.body.descripcion,req.body.categoria_id,req.body.persona_id]);
	
		res.send({'Registro insertado': {"Nombre":req.body.nombre,"Descripcion":req.body.descripcion,"ID Categoria":req.body.categoria_id,"ID Persona":req.body.persona_id}});//responde todo
        
    }   
    catch(e){
        res.status(413).send({"Error": e.message});
        // res.status(413).send("Error Inesperado");
    }
 });
practica.delete('/libro/:id', async(req, res) => {
        try{
            let query= 'SELECT * FROM libro WHERE id = ?';

            let respuesta = await qy(query, [req.params.id]);

            //valido que el libro exista
            if (respuesta.length == 0) {
                throw new Error('El libro no se encuentra disponible');
            }

            query = 'SELECT persona_id FROM libro WHERE id =?'
            respuesta = await qy( query, [req.params.id]);
            respuesta = JSON.parse(JSON.stringify(respuesta));

            if (respuesta[0].persona_id != null){
                throw new Error("Ese libro está prestado, no puede ser borrado de la base");

            }
            query = 'DELETE FROM libro WHERE id = ?';

            respuesta = await qy(query,[req.params.id]);
            res.send('el libro se borro correctamente');
        }
        catch(e){
            res.status(413).send(e.message);
        }
        
    });

practica.put('/libro/:id', async (req, res)=>{
        try {
           
           if (req.body.nombre != null || req.body.categoria_id != null || req.body.descripcion == null) {
               throw new Error("Solo se puede modificar la descripcion del libro");
           }
    
           
           let query = 'SELECT * FROM libro WHERE  id = ?';
    
           let respuesta = await qy(query, [req.params.id]);
    
           if (respuesta.length == 0) {
               throw new Error("No se encontro el libro");
           }
    
           console.log('podes seguir');
           
           id = respuesta[0].id;
           nombre = respuesta[0].nombre;
           descripcion = req.body.descripcion;
           categoria_id = respuesta[0].categoria_id;
           persona_id = respuesta[0].persona_id;
    
        
           query = 'UPDATE libro SET descripcion = ? WHERE id = ?';
    
           respuesta = await qy(query, [descripcion,req.params.id]);
    
        
           res.send({'Registro actualizado': {"Id":req.params.id,"Nombre":nombre,"Descripcion":descripcion,"Categoria ID":categoria_id,"Persona ID":persona_id}});
    
        }
        catch(e){
           console.error(e.message);
           res.status(413).send({"Error": e.message});
           res.status(413).send("Error Inesperado");
       }
    });
    
    
practica.put('/libro/prestar/:id', async (req, res)=>{
        try {
           
           let query = 'SELECT * FROM libro WHERE  id = ?';
    
           let respuesta = await qy(query, [req.params.id]);
    
           if (respuesta.length == 0) {
               throw new Error("No se encontro el libro");
           }
    
           if (respuesta[0].persona_id != null ) {
                throw new Error("El libro ya se encuentra prestado, no se puede prestar hasta que no se devuelva");
            }
    
    
            query = 'SELECT * FROM persona WHERE  id = ?';
    
            respuesta = await qy(query, [req.body.persona_id]);
    
            if (respuesta.length == 0 ) {
                throw new Error("no se encontro la persona a la que se quiere prestar el libro");
            }
    
            persona_id = req.body.persona_id;
    
        
           query = 'UPDATE libro SET persona_id = ? WHERE id = ?';
    
           respuesta = await qy(query, [persona_id,req.params.id]);
        
           res.send('Se presto correctamente');
    
        }
        catch(e){
           console.error(e.message);
           res.status(413).send({"Error": e.message});
       }
    });
    
    
practica.put('/libro/devolver/:id', async (req, res)=>{
        try {
           
           let query = 'SELECT * FROM libro WHERE  id = ?';
    
           let respuesta = await qy(query, [req.params.id]);
    
           if (respuesta.length == 0) {
               throw new Error("Ese libro no existe");
           }
    
           if (respuesta[0].persona_id == null ) {
                throw new Error("Ese libro no estaba prestado");
            }
        
           query = 'UPDATE libro SET persona_id = null WHERE id = ?';
    
           respuesta = await qy(query, [req.params.id]);
        
           res.send('Se devolvió correctamente');
    
        }
        catch(e){
           res.status(413).send({"Error": e.message});
       }
    });
    



practica.listen(port, ()=>{
    console.log('Servidor escuchando' ,port);
})


