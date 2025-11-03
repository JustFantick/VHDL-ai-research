library ieee;
use ieee.std_logic_1164.all;

ENTITY comparator IS
    PORT(
        a:in std_logic_vector(6 downto 0);
        y:out std_logic
    );
END comparator;

architecture behavioral of comparator is
begin
    y <= not(not a(6) or (a(6) and not a(5) and not a(4) and not a(3)) or 
              (a(6) and not a(5) and not a(4) and a(3) and not a(2) and not a(1)));
end behavioral;
