import { Router } from 'express'
import { ProductsController } from '../controllers/products-controller.js'


const productsRouter = Router()

productsRouter.get('/', ProductsController.getAllProducts)
productsRouter.get('/:id', ProductsController.getProductById)
productsRouter.post('/', ProductsController.createProduct)
productsRouter.put('/:id', ProductsController.updateProduct)
productsRouter.delete('/:id', ProductsController.deleteProduct)

export default productsRouter