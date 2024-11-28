import { Router } from 'express'
import { CartController } from '../controllers/cart-controller.js'

const cartRouter = Router()

cartRouter.get('/:userId', CartController.getCartByUser)
cartRouter.post('/', CartController.addToCart)
cartRouter.delete('/:id', CartController.removeFromCart)


export default cartRouter