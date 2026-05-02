<?php

class MenuDao
{
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    public function getCategories(): array {
        $stmt = $this->db->query(
            'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC'
        );
        return $stmt->fetchAll();
    }

    public function getMenuItems(array $filters = []): array {
        $sql = 'SELECT mi.*, c.name AS category_name
                FROM menu_items mi
                JOIN categories c ON mi.category_id = c.id
                WHERE mi.is_available = 1 AND c.is_active = 1';

        $params = [];

        if (!empty($filters['category_id'])) {
            $sql .= ' AND mi.category_id = :category_id';
            $params['category_id'] = (int) $filters['category_id'];
        }
        if (!empty($filters['vegan']))       $sql .= ' AND mi.is_vegan = 1';
        if (!empty($filters['vegetarian']))  $sql .= ' AND mi.is_vegetarian = 1';
        if (!empty($filters['halal']))       $sql .= ' AND mi.is_halal = 1';
        if (!empty($filters['gluten_free'])) $sql .= ' AND mi.is_gluten_free = 1';
        if (!empty($filters['spicy']))       $sql .= ' AND mi.is_spicy = 1';

        $sql .= ' ORDER BY c.display_order ASC, mi.name ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
