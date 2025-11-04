library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity generic_counter is
    generic(
        WIDTH : integer := 4
    );
    port(
        clk : in std_logic;
        reset : in std_logic;
        counter : out std_logic_vector(WIDTH - 1 downto 0)
    );
end generic_counter;

architecture behavioral of generic_counter is
    signal counter_up : unsigned(WIDTH - 1 downto 0);
begin
    process(clk)
    begin
        if rising_edge(clk) then
            if reset = '1' then
                counter_up <= (others => '0');
            else
                counter_up <= counter_up - 1;
            end if;
        end if;
    end process;
    counter <= std_logic_vector(counter_up);
end behavioral;