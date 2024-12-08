import connection from "../config/db.js";
import {validatePartialSchema, validateProductSchema} from "../schemas/product-schema.js"

export class ProductsController {

    static getAllProducts(req, res)  //Retorna la toda la lista
    {
        const consult = "SELECT * FROM productos"

        try
        {
            connection.query(consult, (error, results)=>{

                if(error){
                    return res.status(400)
                        .json({message: "Error en la consulta"})
                }

                return res.status(200)
                .header('Content-Type', 'application/json')
                .json(results)

            })
        }catch(e)
        {
            return res.status(400)
            .json({
                error: true,
                message: "Error en obtener los datos"
            })
        }
    }
    
    static getProductById (req, resp){  //Obtencion de productos por _id
        const {id} = req.params

        const consult = "Select * from productos WHERE id = ?"

        try{
            connection.query(consult, [id], (error, result)=>{
                if(error){
                    return resp.status(400)
                            .json({message: "Error al obtener los datos"})
                }
                if(result && result.length == 0 ){
                    return resp.status(404)
                        .json({message: "No se encontro el producto"})
                }

                return resp.status(201)
                    .header('Content-Type', 'application/json')
                    .json(result)

            })
        }catch(e){
            return resp.status(400)
            .json({
                error: true,
                message: "Error en obtener los datos"
            })
        }
        
    }


      /**
     * Metodo Post para guardar productos
     */

      static createProduct(req, resp)
      {
          const data = req.body
  
          const {success, error} = validateProductSchema(data)
  
          if(!success){
              resp.status(400)
              .json({
                  message: JSON.parse(error.message)
              })
          }
  
          const consult = "INSERT INTO productos (nombre, descripcion, precio, categoria) VALUES (?, ?, ?, ?)"
  
          try{
              const {nombre, descripcion, precio, stock, categoria} = data
  
              connection.query(consult, [nombre, descripcion, precio, stock, categoria], (error, results)=>{
                console.log(results)
                  if(error){
                      return resp.status(400)
                      .json({message: "Error en la creacion de los datos"})
                  }
  
                  return resp.status(201)
                      .header('Content-Type', 'application/json')
                      .json(data)
  
              })
          }catch(e){
              return resp.status(400)
                  .json({
                      error: true,
                      message: "Error en la creacion"
                  })
          }   
      }

      /**
       * PUT ACTUALIZAR PRODUCTO
       */
      static updateProduct(req, res){
          const { id } = req.params
          
          const data = req.body
  
          const {success, error} = validatePartialSchema(data)
  
          if(!success){
              res.status(400)
                  .JSON.parse(error.message)
              }
          
          try
          {
            
              const keys = Object.keys(data)
              const valores = Object.values(data)
  
              const setConsult = keys.map((key)=>`${key} = ?`).join(", ")
              
              const consult =  `UPDATE productos SET ${setConsult} WHERE id = ?`
  
              connection.query(consult, [...valores, id], (error, result)=>{
                  if(error){
                      return res.status(400)
                          .json({
                              message: error.message
                          })
                  }
                  if(result.affectedRows == 0){
                      return res.status(404)
                      .json({message: "No se encontro resultado para actualizar"})
                  }
                  return res.status(200)
                      .header("Content-Type", "application/json")
                      .json({
                          message: "registro actualizado con EXITO"
                      })
              })
                  
          }
          catch(e){
             return res.status(400)
                  .json({
                      error: true,
                      message: e.message
                  })
          }
      }
  
      /**
       * DELETE 
       */
      static deleteProduct(req, res) {
  
          const {id} = req.params
  
          const consult = "DELETE FROM productos WHERE id = ?"
  
          try{
              connection.query(consult, [id], (error, result)=>{
  
                  if(error){
                      return res.status(400)
                          .json({
                              message: "Error al borrar el registro"
                          })
                  }

                  if(result.affectedRows ===0){
                    return res.status(404)
                        .json({message: "no se encontro el producto"})
                  }
  
                  return res.status(200)
                      .json({message: "Registro borrado con exito"})
  
              })
          }catch(e){
              return res.status(400)
                  .json({
                      error: true,
                      message: "Error"
                  })
          }
      }
}