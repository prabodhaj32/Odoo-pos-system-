from odoo import models, fields

class ShopPOSProduct(models.Model):
    _name = 'shop.pos.product'
    _description = 'POS Product'

    name = fields.Char(string="Product Name")
    price = fields.Float(string="Price")
    quantity = fields.Integer(string="Stock")


class ShopPOSOrder(models.Model):
    _name = 'shop.pos.order'
    _description = 'POS Order'

    product_id = fields.Many2one('shop.pos.product', string="Product")
    qty = fields.Integer(string="Quantity")
    total = fields.Float(string="Total")