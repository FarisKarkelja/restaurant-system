<?php

class MenuDao
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function getCategories(): array
    {
        $stmt = $this->db->query(
            'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC'
        );
        return $stmt->fetchAll();
    }

    public function getMenuItems(array $filters = []): array
    {
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

    public function getItemById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM menu_items WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getCategoryById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM categories WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function createCategory(string $name, string $desc, int $order): array
    {
        $this->db->prepare(
            'INSERT INTO categories (name, description, display_order) VALUES (:name, :desc, :order)'
        )->execute(['name' => $name, 'desc' => $desc, 'order' => $order]);
        return $this->getCategoryById((int) $this->db->lastInsertId());
    }

    public function updateCategory(int $id, string $name, string $desc, int $order, bool $isActive): void
    {
        $this->db->prepare(
            'UPDATE categories SET name=:name, description=:desc, display_order=:order, is_active=:active WHERE id=:id'
        )->execute(['name' => $name, 'desc' => $desc, 'order' => $order, 'active' => $isActive ? 1 : 0, 'id' => $id]);
    }

    public function deleteCategory(int $id): void
    {
        $this->db->prepare('DELETE FROM categories WHERE id = :id')->execute(['id' => $id]);
    }

    public function createItem(array $d): array
    {
        $this->db->prepare(
            'INSERT INTO menu_items
                 (category_id, name, description, price, image_url,
                  is_available, is_vegan, is_vegetarian, is_halal, is_gluten_free, is_spicy)
             VALUES
                 (:cat, :name, :desc, :price, :img,
                  :avail, :vegan, :veg, :halal, :gf, :spicy)'
        )->execute([
            'cat'   => $d['category_id'],
            'name'  => $d['name'],
            'desc'  => $d['description']    ?? null,
            'price' => $d['price'],
            'img'   => $d['image_url']      ?? null,
            'avail' => $d['is_available']   ?? 1,
            'vegan' => $d['is_vegan']       ?? 0,
            'veg'   => $d['is_vegetarian']  ?? 0,
            'halal' => $d['is_halal']       ?? 0,
            'gf'    => $d['is_gluten_free'] ?? 0,
            'spicy' => $d['is_spicy']       ?? 0,
        ]);
        return $this->getItemById((int) $this->db->lastInsertId());
    }

    public function updateItem(int $id, array $d): void
    {
        $this->db->prepare(
            'UPDATE menu_items SET
                 category_id=:cat, name=:name, description=:desc, price=:price, image_url=:img,
                 is_available=:avail, is_vegan=:vegan, is_vegetarian=:veg,
                 is_halal=:halal, is_gluten_free=:gf, is_spicy=:spicy
             WHERE id=:id'
        )->execute([
            'cat'   => $d['category_id'],
            'name'  => $d['name'],
            'desc'  => $d['description']    ?? null,
            'price' => $d['price'],
            'img'   => $d['image_url']      ?? null,
            'avail' => $d['is_available']   ?? 1,
            'vegan' => $d['is_vegan']       ?? 0,
            'veg'   => $d['is_vegetarian']  ?? 0,
            'halal' => $d['is_halal']       ?? 0,
            'gf'    => $d['is_gluten_free'] ?? 0,
            'spicy' => $d['is_spicy']       ?? 0,
            'id'    => $id,
        ]);
    }

    public function deleteItem(int $id): void
    {
        $this->db->prepare('DELETE FROM menu_items WHERE id = :id')->execute(['id' => $id]);
    }
}
