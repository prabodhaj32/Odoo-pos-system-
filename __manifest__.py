
{
    'name': 'Shop POS Frontend',
    'version': '1.0',
    'summary': 'Simple Shop POS Frontend Dashboard',
    'author': 'Prabodha',
    'category': 'Sales',
    'depends': ['base','web','point_of_sale'],
    
    'data': [
        'static/src/xml/pos_dashbord_view.xml',
        'views/product_views.xml',
        'views/order_views.xml',
        'views/pos_menu.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'shop_pos_frontend/static/src/js/pos_dashboard.js',
            'shop_pos_frontend/static/src/xml/pos_dashbord_view.xml',
            'shop_pos_frontend/static/src/css/pos_dashboard.css',
        ],
    },
    'installable': True,
    'application': True,
}

